import { z } from 'zod';
import { calendarService } from '../services/calendarService.js';
import { parseIndianDate, formatIndianDate, formatISTTime } from '../utils/dateUtils.js';

export const calendarTools = [
  {
    name: 'check_calendar_availability',
    description:
      "Checks the user's Google Calendar for existing events and busy slots within a specified date/time window. Call this tool whenever asked about schedule availability, free slots, or before proposing/scheduling a meeting to avoid overlap.",
    isWriteAction: false,
    schema: z.object({
      startDate: z
        .string()
        .min(1)
        .describe(
          'Start date, Indian format date (e.g. "23-10-2026", "23 oct", "23 October 2026"), or ISO timestamp (e.g. "2026-10-23T10:00:00Z") to begin checking calendar availability.'
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
          'Optional timezone string (e.g., "America/New_York", "Asia/Kolkata", "UTC"). Defaults to "Asia/Kolkata".'
        ),
    }),
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description:
            'Start date, Indian format date (e.g. "23-10-2026", "23 oct", "23 October 2026"), or ISO timestamp to begin checking calendar availability.',
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
          calendarRetrieved: false,
          hasConflicts: null,
          totalEvents: null,
          events: [],
          message:
            'No authenticated user session is active. Google Calendar integration requires logging in with Google OAuth (/api/auth/google). Availability could not be verified.',
        };
      }

      return await calendarService.checkAvailability({
        user,
        timeMin: startDate,
        timeMax: endDate,
        timeZone: timeZone || 'Asia/Kolkata',
      });
    },
  },

  {
    name: 'create_calendar_event',
    description:
      'Schedules and creates a new meeting or event on the user\'s Google Calendar with a title, start datetime, end datetime, location/platform, and optional description. Checks for time conflicts to avoid overlaps. THIS IS A WRITE ACTION THAT MUTATES EXTERNAL STATE AND REQUIRES HUMAN CONFIRMATION BEFORE EXECUTION.',
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
      location: z
        .string()
        .nullable()
        .optional()
        .describe('Location or platform where the meeting will be held, e.g. "Google Meet", "Room 402", or an address. Defaults to "Google Meet".'),
      timeZone: z
        .string()
        .nullable()
        .optional()
        .describe('Optional timezone (e.g. "Asia/Kolkata", "America/New_York", "UTC"). Defaults to "Asia/Kolkata".'),
      attendees: z
        .array(z.string())
        .nullable()
        .optional()
        .describe('Optional list of attendee email addresses or participant names'),
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
        location: {
          type: ['string', 'null'],
          description: 'Location or platform where the meeting will be held (e.g. "Google Meet", "Room 402").',
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
          description: 'Optional array of attendee email addresses or participant names.',
        },
      },
      required: ['summary', 'startTime', 'endTime'],
    },
    getConfirmationDescription: (args = {}) => {
      try {
        const s = parseIndianDate(args.startTime) || new Date(args.startTime);
        const e = parseIndianDate(args.endTime) || new Date(args.endTime);
        const dateStr = formatIndianDate(s, 'full');
        const timeStr = `${formatISTTime(s)} – ${formatISTTime(e)}`;
        const attendeesStr = args.attendees && args.attendees.length ? ` with ${args.attendees.join(', ')}` : '';
        const locStr = args.location ? ` at ${args.location}` : ' via Google Meet';
        return `Schedule calendar event "${args.summary}" on ${dateStr} from ${timeStr}${attendeesStr}${locStr}.`;
      } catch (_) {
        return `Schedule calendar event "${args.summary || 'Meeting'}".`;
      }
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
        location: args.location || '',
        timeZone: args.timeZone || 'Asia/Kolkata',
        attendees: args.attendees || [],
      });
    },
  },
];
