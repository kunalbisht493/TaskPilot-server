import { systemTools } from './systemTools.js';

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    // Register initial system verification tools
    for (const tool of systemTools) {
      this.registerTool(tool);
    }
  }

  /**
   * Register a new tool definition
   */
  registerTool(tool) {
    if (!tool.name || typeof tool.execute !== 'function') {
      throw new Error(`Invalid tool registration for: ${tool?.name || 'unknown'}`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieve a tool by name
   */
  getTool(name) {
    return this.tools.get(name);
  }

  /**
   * Return all registered tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Formats tool definitions for the Google Gemini API (FunctionDeclaration[])
   */
  getGeminiFunctionDeclarations() {
    return this.getAllTools().map((t) => {
      // Clone parameters to avoid mutating original
      const params = JSON.parse(JSON.stringify(t.parameters || { type: 'object', properties: {} }));
      if (params.properties) {
        for (const key of Object.keys(params.properties)) {
          const prop = params.properties[key];
          if (Array.isArray(prop.type)) {
            // Pick the non-null type for Gemini and mark nullable
            prop.type = prop.type.find((tp) => tp !== 'null') || 'string';
            prop.nullable = true;
          }
        }
      }
      return {
        name: t.name,
        description: t.description,
        parameters: params,
      };
    });
  }

  /**
   * Formats tool definitions for the Groq / OpenAI compatible API
   */
  getGroqToolDeclarations() {
    return this.getAllTools().map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  /**
   * Validates arguments against the tool's Zod schema, checks confirmation guardrails, and executes.
   */
  async validateAndExecute(toolName, rawArgs = {}, context = {}) {
    const tool = this.getTool(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" is not registered in the system.`,
      };
    }

    // Step 1: Input Validation via Zod
    if (tool.schema) {
      const validation = tool.schema.safeParse(rawArgs);
      if (!validation.success) {
        const issues = validation.error.issues
          .map((i) => `Field "${i.path.join('.')}": ${i.message}`)
          .join(', ');
        return {
          success: false,
          isValidationError: true,
          error: `Argument validation failed for tool "${toolName}": ${issues}`,
        };
      }
      rawArgs = validation.data;
    }

    // Step 2: Guardrail - Check if write action requires human confirmation
    if (tool.isWriteAction && !context.isConfirmed) {
      return {
        success: false,
        needsConfirmation: true,
        tool: toolName,
        args: rawArgs,
        description: tool.description,
      };
    }

    // Step 3: Tool Execution
    try {
      const result = await tool.execute(rawArgs, context);
      return {
        success: true,
        result,
      };
    } catch (err) {
      return {
        success: false,
        error: `Execution error in "${toolName}": ${err.message}`,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
