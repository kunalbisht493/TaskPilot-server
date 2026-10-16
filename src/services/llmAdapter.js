import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { config } from '../config/env.js';
import { toolRegistry } from '../tools/index.js';

function sanitizeResponse(text) {
  if (!text || typeof text !== 'string') return text || '';
  // Clean up any degenerate stuttering loops (e.g. repeated ellipses or dashes)
  return text
    .replace(/([.…]+\s*){3,}/g, '... ')
    .replace(/([‑\-–—]\s*){3,}/g, '- ')
    .trim();
}

class LLMAdapter {
  constructor() {
    this.geminiClient = null;
    this.groqClient = null;

    if (config.gemini.apiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.gemini.apiKey);
    }

    if (config.groq.apiKey) {
      this.groqClient = new Groq({ apiKey: config.groq.apiKey });
    }
  }

  /**
   * Determine active provider
   */
  getActiveProvider(requestedProvider) {
    const provider = requestedProvider || config.defaultProvider;
    if (provider === 'gemini' && config.gemini.apiKey) return 'gemini';
    if (provider === 'groq' && config.groq.apiKey) return 'groq';
    if (config.gemini.apiKey) return 'gemini';
    if (config.groq.apiKey) return 'groq';
    return 'mock'; // Fallback for unit testing and offline dev
  }

  /**
   * Generate next reasoning step or tool call
   */
  async planNextStep({ messages, systemInstruction, providerPreference }) {
    const activeProvider = this.getActiveProvider(providerPreference);

    switch (activeProvider) {
      case 'gemini':
        return this.callGemini({ messages, systemInstruction });
      case 'groq':
        return this.callGroq({ messages, systemInstruction });
      case 'mock':
      default:
        return this.callMockProvider({ messages });
    }
  }

  /**
   * Google Gemini Implementation
   */
  async callGemini({ messages, systemInstruction }) {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenerativeAI(config.gemini.apiKey);
    }

    const modelName = config.gemini.model || 'gemini-3.8-flash';
    const functionDeclarations = toolRegistry.getGeminiFunctionDeclarations();

    const model = this.geminiClient.getGenerativeModel({
      model: modelName,
      systemInstruction,
      tools: [{ functionDeclarations }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    // Format conversation history for Gemini contents
    const contents = messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: m.name,
                response: { output: m.content },
              },
            },
          ],
        };
      }

      if (m.role === 'assistant' && m.toolCall) {
        return {
          role: 'model',
          parts: [
            ...(m.content ? [{ text: m.content }] : []),
            {
              functionCall: {
                name: m.toolCall.name,
                args: m.toolCall.args,
              },
            },
          ],
        };
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }],
      };
    });

    const result = await model.generateContent({ contents });
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      return {
        type: 'tool_call',
        name: call.name,
        args: call.args,
        reasoning: response.text() || 'Executing tool to progress toward user goal.',
        provider: 'gemini',
      };
    }

    return {
      type: 'final_answer',
      content: sanitizeResponse(response.text()),
      provider: 'gemini',
    };
  }

  /**
   * Groq Implementation (OpenAI-compatible)
   */
  async callGroq({ messages, systemInstruction }) {
    if (!this.groqClient) {
      this.groqClient = new Groq({ apiKey: config.groq.apiKey });
    }

    const modelName = config.groq.model || 'openai/gpt-oss-120b';
    const tools = toolRegistry.getGroqToolDeclarations();

    const groqMessages = [
      ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
      ...messages.map((m, idx) => {
        if (m.role === 'tool') {
          let toolCallId = m.toolCallId;
          if (!toolCallId) {
            for (let i = idx - 1; i >= 0; i--) {
              if (messages[i].role === 'assistant' && (messages[i].toolCallId || messages[i].toolCall?.id)) {
                toolCallId = messages[i].toolCallId || messages[i].toolCall.id;
                break;
              }
            }
          }
          return {
            role: 'tool',
            tool_call_id: toolCallId || `call_${m.name}`,
            name: m.name,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          };
        }
        if (m.role === 'assistant' && m.toolCall) {
          const callId = m.toolCall.id || m.toolCallId || `call_${m.toolCall.name}`;
          return {
            role: 'assistant',
            content: m.content || null,
            tool_calls: [
              {
                id: callId,
                type: 'function',
                function: {
                  name: m.toolCall.name,
                  arguments: JSON.stringify(m.toolCall.args),
                },
              },
            ],
          };
        }
        return {
          role: m.role,
          content: m.content,
        };
      }),
    ];

    const response = await this.groqClient.chat.completions.create({
      model: modelName,
      messages: groqMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 1024,
    });

    const choice = response.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        parsedArgs = {};
      }

      return {
        type: 'tool_call',
        toolCallId: toolCall.id,
        name: toolCall.function.name,
        args: parsedArgs,
        reasoning: message.content || 'Determined tool call required for next step.',
        provider: 'groq',
      };
    }

    return {
      type: 'final_answer',
      content: sanitizeResponse(message.content || ''),
      provider: 'groq',
    };
  }

  /**
   * Deterministic Mock Provider for offline testing and initial validation
   */
  async callMockProvider({ messages }) {
    const lastMessage = messages[messages.length - 1];

    // If last message was a tool observation, wrap up with final answer
    if (lastMessage && lastMessage.role === 'tool') {
      return {
        type: 'final_answer',
        content: `I received the result from "${lastMessage.name}": ${JSON.stringify(lastMessage.content)}. Your request has been processed successfully.`,
        provider: 'mock',
      };
    }

    // Inspect user goal to trigger appropriate mock tool
    const userText = messages[0]?.content?.toLowerCase() || '';

    if (userText.includes('time') || userText.includes('date') || userText.includes('today')) {
      return {
        type: 'tool_call',
        name: 'get_current_time',
        args: {},
        reasoning: 'The user is inquiring about time or date. I need to check the current server time first.',
        provider: 'mock',
      };
    }

    if (userText.includes('calculate') || userText.includes('math') || /\d+[\+\-\*\/]\d+/.test(userText)) {
      return {
        type: 'tool_call',
        name: 'calculate',
        args: { expression: '24 - 19.5' },
        reasoning: 'Evaluating mathematical calculation requested by the user.',
        provider: 'mock',
      };
    }

    return {
      type: 'final_answer',
      content: `[Mock LLM] Understood your request: "${messages[0]?.content}". (Configure GEMINI_API_KEY or GROQ_API_KEY in .env for live AI models).`,
      provider: 'mock',
    };
  }
}

export const llmAdapter = new LLMAdapter();
