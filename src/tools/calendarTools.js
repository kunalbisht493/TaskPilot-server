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
];
