import { z } from 'zod';

export const systemTools = [
  {
    name: 'get_current_time',
    description: 'Returns the current server date, time, day of week, and timezone. Call this whenever you need to resolve relative dates like "today", "tomorrow", "next Tuesday", or compute remaining time.',
    isWriteAction: false,
    schema: z.object({
      timezone: z.string().optional().describe('Optional timezone identifier, e.g. "Asia/Kolkata", "America/New_York", or "UTC"'),
    }),
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional timezone identifier (e.g., "UTC", "America/New_York", "Asia/Kolkata"). Defaults to local system time.',
        },
      },
      required: [],
    },
    execute: async (args = {}) => {
      const now = new Date();
      const tz = args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(now);

      return {
        iso: now.toISOString(),
        formatted,
        timeZone: tz,
        dayOfWeek: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now),
        hours: now.getHours(),
        minutes: now.getMinutes(),
      };
    },
  },

  {
    name: 'calculate',
    description: 'Safely evaluates basic arithmetic expressions (addition, subtraction, multiplication, division, modulo). Use this to calculate time differences, durations, or counts.',
    isWriteAction: false,
    schema: z.object({
      expression: z.string().min(1).describe('Mathematical expression to calculate, e.g. "24 - 19.5" or "7 * 24"'),
    }),
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'A mathematical expression containing only numbers, spaces, and operators (+, -, *, /, %, parenthesis).',
        },
      },
      required: ['expression'],
    },
    execute: async ({ expression }) => {
      // Sanitize expression: allow only numbers, whitespace, parentheses, and math operators
      if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        throw new Error('Invalid math expression. Only numbers and basic operators are permitted.');
      }
      try {
        // Safe evaluation of sanitized math expression
        const result = Function(`"use strict"; return (${expression})`)();
        return {
          expression,
          result: Number(result),
        };
      } catch (err) {
        throw new Error(`Calculation error: ${err.message}`);
      }
    },
  },

  {
    name: 'echo',
    description: 'Echoes back a given text string. Used for testing connectivity and diagnostic verification.',
    isWriteAction: false,
    schema: z.object({
      message: z.string().describe('The message to echo back'),
    }),
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to echo back',
        },
      },
      required: ['message'],
    },
    execute: async ({ message }) => {
      return { echoed: message, timestamp: new Date().toISOString() };
    },
  },
];
