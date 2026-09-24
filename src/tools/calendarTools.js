import { z } from 'zod';
import { calendarService } from '../services/calendarService.js';

export const calendarTools = [
  {
    name: 'check_calendar_availability',
    description:
      "Checks the user's Google Calendar for existing events and busy slots within a specified date/time window. Call this tool whenever asked about schedule availability, free slots, or before proposing/scheduling a meeting.",
    isWriteAction: false,
    schema: z.object({
      startDate: z
        .string()
        .min(1)
        .describe(
          'Start date or ISO timestamp (e.g. "2026-09-24" or "2026-09-24T10:00:00Z") to begin checking calendar availability.'
        ),
      endDate: z
        .string()
        .nullable()
        .optional()
        .describe(
          'Optional end date or ISO timestamp (e.g. "2026-09-24T18:00:00Z"). Defaults to the end of the start day if null or omitted.'
        ),
      timeZone: z
        .string()
        .nullable()
        .optional()
        .describe(
          'Optional timezone string (e.g., "America/New_York", "Asia/Kolkata", "UTC"). Defaults to local or UTC.'
        ),
    }),
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description:
            'Start date or ISO timestamp (e.g. "2026-09-24" or "2026-09-24T09:00:00Z") to begin checking calendar availability.',
        },
        endDate: {
          type: ['string', 'null'],
          description:
            'Optional end date or ISO timestamp. Defaults to the end of the start day if null or omitted.',
        },
        timeZone: {
          type: ['string', 'null'],
          description:
            'Optional timezone identifier (e.g., "UTC", "America/New_York", "Asia/Kolkata").',
        },
      },
      required: ['startDate'],
    },
    execute: async ({ startDate, endDate, timeZone }, context = {}) => {
      const user = context.user;

      if (!user) {
        return {
          connected: false,
          message:
            'No authenticated user session is active. Google Calendar integration requires logging in with Google OAuth (/api/auth/google).',
        };
      }

      return await calendarService.checkAvailability({
        user,
        timeMin: startDate,
        timeMax: endDate,
        timeZone,
      });
    },
  },

  {
    name: 'create_calendar_event',
    description:
      'Schedules and creates a new meeting or event on the user\'s Google Calendar with a title, start datetime, end datetime, and optional description. THIS IS A WRITE ACTION THAT MUTATES EXTERNAL STATE AND REQUIRES HUMAN CONFIRMATION BEFORE EXECUTION.',
    isWriteAction: true,
    schema: z.object({
      summary: z.string().min(1).describe('The title or summary of the meeting/event, e.g. "Meeting with Mentor"'),
      startTime: z
        .string()
        .min(1)
        .describe('ISO 8601 start date and time string, e.g. "2026-09-24T15:00:00Z" or "2026-09-24T15:00:00"'),
      endTime: z
        .string()
        .min(1)
        .describe('ISO 8601 end date and time string, e.g. "2026-09-24T16:00:00Z" or "2026-09-24T16:00:00"'),
      description: z
        .string()
        .nullable()
        .optional()
        .describe('Optional meeting agenda or notes'),
      timeZone: z
        .string()
        .nullable()
        .optional()
        .describe('Optional timezone (e.g. "Asia/Kolkata", "America/New_York", "UTC")'),
      attendees: z
        .array(z.string().email())
        .nullable()
        .optional()
        .describe('Optional list of attendee email addresses'),
    }),
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Title or summary of the calendar event.',
        },
        startTime: {
          type: 'string',
          description: 'ISO 8601 start datetime string (e.g. "2026-09-24T15:00:00Z").',
        },
        endTime: {
          type: 'string',
          description: 'ISO 8601 end datetime string (e.g. "2026-09-24T16:00:00Z").',
        },
        description: {
          type: ['string', 'null'],
          description: 'Optional description or agenda for the event.',
        },
        timeZone: {
          type: ['string', 'null'],
          description: 'Optional timezone identifier (e.g. "UTC", "Asia/Kolkata").',
        },
        attendees: {
          type: ['array', 'null'],
          items: {
            type: 'string',
          },
          description: 'Optional array of attendee email addresses.',
        },
      },
      required: ['summary', 'startTime', 'endTime'],
    },
    execute: async (args, context = {}) => {
      const user = context.user;

      if (!user) {
        return {
          success: false,
          error:
            'No authenticated user session found. User must connect their Google Calendar via /api/auth/google.',
        };
      }

      return await calendarService.createEvent({
        user,
        summary: args.summary,
        startTime: args.startTime,
        endTime: args.endTime,
        description: args.description || '',
        timeZone: args.timeZone,
        attendees: args.attendees || [],
      });
    },
  },
];
