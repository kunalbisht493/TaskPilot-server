import { google } from 'googleapis';
import { getAuthenticatedClientForUser } from './googleAuthService.js';
import { config } from '../config/env.js';
import {
  parseIndianDate,
  formatIndianDate,
  formatISTTime,
  formatISTWeekday,
  resolveCalendarWindow,
} from '../utils/dateUtils.js';

// In-memory demo sandbox events store keyed by userId
const demoEventsStore = new Map();

function getDemoEventsForUser(userId) {
  const key = String(userId || 'default_demo');
  if (!demoEventsStore.has(key)) {
    const now = new Date();
    // Default standup today 10:00 - 10:30 IST
    const todayStandupStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const todayStandupEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);

    // Architecture review tomorrow 14:00 - 15:00 IST
    const tmrwStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0, 0);
    const tmrwEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0);

    demoEventsStore.set(key, [
      {
        id: 'demo_evt_standup',
        summary: 'Engineering Sync & Standup',
        description: 'Daily team sync and sprint progress check',
        location: 'Google Meet',
        start: { dateTime: todayStandupStart.toISOString() },
        end: { dateTime: todayStandupEnd.toISOString() },
        attendees: [{ displayName: 'Team Lead' }, { email: 'lead@company.com' }],
        status: 'confirmed',
        htmlLink: 'https://meet.google.com/demo-eval-call',
      },
      {
        id: 'demo_evt_arch',
        summary: 'Architecture Review with Principal Eng',
        description: 'Review system design, MongoDB TTL, and ReAct loop guardrails',
        location: 'Conference Room Alpha',
        start: { dateTime: tmrwStart.toISOString() },
        end: { dateTime: tmrwEnd.toISOString() },
        attendees: [{ displayName: 'Sarah Connor' }],
        status: 'confirmed',
        htmlLink: 'https://meet.google.com/demo-eval-call',
      },
    ]);
  }
  return demoEventsStore.get(key);
}

/**
 * Service to interface with Google Calendar API (v3)
 */
export const calendarService = {
  /**
   * Retrieves events and computes free/busy availability for a given time window
   * 
   * @param {Object} params
   * @param {Object} params.user - Mongoose user document containing googleTokens
   * @param {string} params.timeMin - Start date or ISO timestamp
   * @param {string} [params.timeMax] - End date or ISO timestamp (defaults to end of timeMin day)
   * @param {string} [params.timeZone] - Optional timezone string (defaults to 'Asia/Kolkata')
   */
  async checkAvailability({ user, timeMin, timeMax, timeZone = 'Asia/Kolkata' }) {
    if (!user || (!user.isDemoUser && !user.googleTokens?.accessToken && !user.googleTokens?.refreshToken)) {
      return {
        isConnected: false,
        calendarRetrieved: false,
        hasConflicts: null,
        totalEvents: null,
        events: [],
        message: 'Google Calendar is not connected. User must sign in via Google OAuth to access calendar data.',
      };
    }

    // Demo / Sandbox Calendar Evaluator Mode
    if (user.isDemoUser || user.email === 'recruiter@taskpilot.demo') {
      const { isoTimeMin, isoTimeMax } = resolveCalendarWindow(timeMin, timeMax, timeZone);
      const minDate = new Date(isoTimeMin);
      const maxDate = new Date(isoTimeMax);
      const allDemo = getDemoEventsForUser(user._id);

      const items = allDemo.filter((evt) => {
        const s = new Date(evt.start.dateTime || evt.start.date);
        const e = new Date(evt.end.dateTime || evt.end.date);
        return s < maxDate && e > minDate;
      });

      const events = items.map((evt) => {
        const s = parseIndianDate(evt.start.dateTime || evt.start.date) || new Date(evt.start.dateTime || evt.start.date);
        const e = parseIndianDate(evt.end.dateTime || evt.end.date) || new Date(evt.end.dateTime || evt.end.date);
        const participants = evt.attendees ? evt.attendees.map((a) => a.displayName || a.email) : [];
        const startIST = formatISTTime(s);
        const endIST = formatISTTime(e);
        const timeIST = `${startIST} – ${endIST}`;
        const date = formatIndianDate(s, 'full');
        const weekday = formatISTWeekday(s);
        const location = evt.location || 'Google Meet';

        return {
          id: evt.id,
          title: evt.summary || '(No Title)',
          summary: evt.summary || '(No Title)',
          description: evt.description || '',
          location,
          start: evt.start.dateTime || evt.start.date,
          end: evt.end.dateTime || evt.end.date,
          date,
          weekday,
          startIST,
          endIST,
          timeIST,
          participants,
          attendees: participants,
          isAllDay: !evt.start.dateTime,
          status: evt.status,
          link: evt.htmlLink || 'https://meet.google.com/demo-eval-call',
        };
      });

      const busySlots = events.map((e) => ({
        title: e.summary,
        from: e.start,
        to: e.end,
        timeIST: e.timeIST,
        date: e.date,
        weekday: e.weekday,
        location: e.location,
        participants: e.participants,
      }));

      const conflictDescriptions = events
        .map((e) => {
          const withWho = e.participants.length > 0 ? ` with ${e.participants.join(', ')}` : '';
          const loc = e.location ? ` at ${e.location}` : '';
          return `"${e.summary}" on ${e.date} (${e.timeIST})${withWho}${loc}`;
        })
        .join('; ');

      return {
        isConnected: true,
        calendarRetrieved: true,
        isDemoSandbox: true,
        timeWindow: {
          start: isoTimeMin,
          end: isoTimeMax,
          timeZone: timeZone || 'Asia/Kolkata',
        },
        hasConflicts: events.length > 0,
        totalEvents: events.length,
        events,
        busySlots,
        summary:
          events.length === 0
            ? 'The user is completely free with no scheduled events during this window.'
            : `The user has ${events.length} event(s) scheduled during this window: ${conflictDescriptions}.`,
      };
    }

    try {
      const auth = await getAuthenticatedClientForUser(user);
      const calendar = google.calendar({ version: 'v3', auth });

      // Normalize time bounds safely in IST
      const { isoTimeMin, isoTimeMax } = resolveCalendarWindow(timeMin, timeMax, timeZone);

      // Query Google Calendar Events API
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: isoTimeMin,
        timeMax: isoTimeMax,
        singleEvents: true,
        orderBy: 'startTime',
        ...(timeZone ? { timeZone } : {}),
      });

      const items = (response.data.items || []).filter((evt) => evt.status !== 'cancelled');

      // Format events for clear agent consumption
      const events = items.map((evt) => {
        const s = parseIndianDate(evt.start.dateTime || evt.start.date) || new Date(evt.start.dateTime || evt.start.date);
        const e = parseIndianDate(evt.end.dateTime || evt.end.date) || new Date(evt.end.dateTime || evt.end.date);
        const participants = evt.attendees ? evt.attendees.map((a) => a.displayName || a.email) : [];
        const startIST = formatISTTime(s);
        const endIST = formatISTTime(e);
        const timeIST = `${startIST} – ${endIST}`;
        const date = formatIndianDate(s, 'full');
        const weekday = formatISTWeekday(s);
        const location = evt.location || 'Google Meet';

        return {
          id: evt.id,
          title: evt.summary || '(No Title)',
          summary: evt.summary || '(No Title)',
          description: evt.description || '',
          location,
          start: evt.start.dateTime || evt.start.date,
          end: evt.end.dateTime || evt.end.date,
          date,
          weekday,
          startIST,
          endIST,
          timeIST,
          participants,
          attendees: participants,
          isAllDay: !evt.start.dateTime,
          status: evt.status,
          link: evt.htmlLink || evt.hangoutLink || '',
        };
      });

      // Extract busy blocks
      const busySlots = events.map((e) => ({
        title: e.summary,
        from: e.start,
        to: e.end,
        timeIST: e.timeIST,
        date: e.date,
        weekday: e.weekday,
        location: e.location,
        participants: e.participants,
      }));

      const conflictDescriptions = events
        .map((e) => {
          const withWho = e.participants.length > 0 ? ` with ${e.participants.join(', ')}` : '';
          const loc = e.location ? ` at ${e.location}` : '';
          return `"${e.summary}" on ${e.date} (${e.timeIST})${withWho}${loc}`;
        })
        .join('; ');

      return {
        isConnected: true,
        calendarRetrieved: true,
        timeWindow: {
          start: isoTimeMin,
          end: isoTimeMax,
          timeZone: timeZone || 'Asia/Kolkata',
        },
        hasConflicts: events.length > 0,
        totalEvents: events.length,
        events,
        busySlots,
        summary:
          events.length === 0
            ? 'The user is completely free with no scheduled events during this window.'
            : `The user has ${events.length} event(s) scheduled during this window: ${conflictDescriptions}.`,
      };
    } catch (err) {
      console.error('[CalendarService] Error querying availability:', err.message);
      const isApiDisabled =
        err.message?.includes('has not been used in project') ||
        err.message?.includes('it is disabled') ||
        err.message?.includes('Google Calendar API has not been used');
      const projectId = config.google.clientId ? config.google.clientId.split('-')[0] : '210931415970';
      const enableUrl = `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${projectId}`;

      return {
        isConnected: true,
        calendarRetrieved: false,
        hasConflicts: null,
        totalEvents: null,
        events: [],
        error: isApiDisabled
          ? `Google Calendar API has not been enabled for project ${projectId}. Enable it by visiting ${enableUrl}`
          : `Google Calendar API error: ${err.message}`,
        message: isApiDisabled
          ? 'Google Calendar API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console.'
          : `Failed to fetch calendar availability from Google: ${err.message}`,
        actionRequired: isApiDisabled ? 'ENABLE_GOOGLE_CALENDAR_API' : undefined,
        enableUrl: isApiDisabled ? enableUrl : undefined,
      };
    }
  },

  /**
   * Creates a new calendar event on the user's primary Google Calendar with conflict avoidance
   * 
   * @param {Object} params
   * @param {Object} params.user - User document containing googleTokens
   * @param {string} params.summary - Event title/summary
   * @param {string} params.startTime - Start date or ISO timestamp
   * @param {string} params.endTime - End date or ISO timestamp
   * @param {string} [params.description] - Description or agenda
   * @param {string} [params.location] - Location or platform (e.g. Google Meet, Room 101)
   * @param {string} [params.timeZone] - Timezone string (defaults to Asia/Kolkata)
   * @param {Array<string>} [params.attendees] - Array of attendee emails or names
   */
  async createEvent({ user, summary, startTime, endTime, description = '', location = '', timeZone = 'Asia/Kolkata', attendees = [] }) {
    if (!user || (!user.isDemoUser && !user.googleTokens?.accessToken && !user.googleTokens?.refreshToken)) {
      return {
        success: false,
        error: 'Google Calendar is not connected. User must sign in via Google OAuth to create events.',
      };
    }

    // Demo / Sandbox Calendar Evaluator Mode
    if (user.isDemoUser || user.email === 'recruiter@taskpilot.demo') {
      const startDate = parseIndianDate(startTime) || new Date(startTime);
      const endDate = parseIndianDate(endTime) || new Date(endTime);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Invalid meeting start or end time: "${startTime}" - "${endTime}"`);
      }

      const allDemo = getDemoEventsForUser(user._id);
      // Conflict check
      const conflicts = allDemo.filter((item) => {
        const itemStart = new Date(item.start.dateTime || item.start.date);
        const itemEnd = new Date(item.end.dateTime || item.end.date);
        return itemStart < endDate && itemEnd > startDate;
      });

      if (conflicts.length > 0) {
        const conflictingEvents = conflicts.map((evt) => {
          const s = parseIndianDate(evt.start.dateTime || evt.start.date) || new Date(evt.start.dateTime || evt.start.date);
          const e = parseIndianDate(evt.end.dateTime || evt.end.date) || new Date(evt.end.dateTime || evt.end.date);
          const participants = evt.attendees ? evt.attendees.map((a) => a.displayName || a.email) : [];
          return {
            title: evt.summary || '(Untitled Event)',
            summary: evt.summary || '(Untitled Event)',
            date: formatIndianDate(s, 'full'),
            weekday: formatISTWeekday(s),
            startIST: formatISTTime(s),
            endIST: formatISTTime(e),
            timeIST: `${formatISTTime(s)} – ${formatISTTime(e)}`,
            participants,
            location: evt.location || 'Online / Google Meet',
            link: evt.htmlLink || 'https://meet.google.com/demo-eval-call',
          };
        });

        const primaryConflict = conflictingEvents[0];
        const participantStr = primaryConflict.participants.length > 0
          ? ` with ${primaryConflict.participants.join(', ')}`
          : '';

        return {
          success: false,
          overlap: true,
          conflict: true,
          message: `Meeting overlap detected: A meeting is already scheduled on ${primaryConflict.date} from ${primaryConflict.timeIST} titled "${primaryConflict.title}"${participantStr} at ${primaryConflict.location}. Double-booking prevented.`,
          conflictingEvents,
        };
      }

      const defaultLocation = location || 'Google Meet';
      const newEvent = {
        id: 'demo_evt_' + Date.now(),
        summary,
        description: description || '',
        location: defaultLocation,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
        attendees: (Array.isArray(attendees) ? attendees : []).map((item) => {
          const str = String(item).trim();
          return str.includes('@') ? { email: str } : { displayName: str };
        }),
        status: 'confirmed',
        htmlLink: 'https://meet.google.com/demo-eval-call',
      };
      allDemo.push(newEvent);

      const finalParticipants = newEvent.attendees.map((a) => a.displayName || a.email);

      return {
        success: true,
        eventId: newEvent.id,
        title: newEvent.summary,
        summary: newEvent.summary,
        date: formatIndianDate(startDate, 'full'),
        weekday: formatISTWeekday(startDate),
        indianDateFormat: formatIndianDate(startDate, 'dmy'),
        startIST: formatISTTime(startDate),
        endIST: formatISTTime(endDate),
        timeIST: `${formatISTTime(startDate)} – ${formatISTTime(endDate)}`,
        location: newEvent.location,
        participants: finalParticipants,
        withWhom: finalParticipants.length > 0 ? finalParticipants.join(', ') : 'Not specified',
        htmlLink: newEvent.htmlLink,
        hangoutLink: newEvent.htmlLink,
        meetingLink: newEvent.htmlLink,
        link: newEvent.htmlLink,
        status: newEvent.status,
        isDemoSandbox: true,
      };
    }

    try {
      const auth = await getAuthenticatedClientForUser(user);
      const calendar = google.calendar({ version: 'v3', auth });

      const startDate = parseIndianDate(startTime) || new Date(startTime);
      const endDate = parseIndianDate(endTime) || new Date(endTime);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error(`Invalid meeting start or end time: "${startTime}" - "${endTime}"`);
      }

      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      // Guardrail: Avoidance of Overlap / Conflict check before insertion
      const existing = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startIso,
        timeMax: endIso,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const conflicts = (existing.data.items || []).filter((item) => {
        if (item.status === 'cancelled') return false;
        const itemStart = new Date(item.start.dateTime || item.start.date);
        const itemEnd = new Date(item.end.dateTime || item.end.date);
        return itemStart < endDate && itemEnd > startDate;
      });

      if (conflicts.length > 0) {
        const conflictingEvents = conflicts.map((evt) => {
          const s = parseIndianDate(evt.start.dateTime || evt.start.date) || new Date(evt.start.dateTime || evt.start.date);
          const e = parseIndianDate(evt.end.dateTime || evt.end.date) || new Date(evt.end.dateTime || evt.end.date);
          const participants = evt.attendees ? evt.attendees.map((a) => a.displayName || a.email) : [];
          return {
            title: evt.summary || '(Untitled Event)',
            summary: evt.summary || '(Untitled Event)',
            date: formatIndianDate(s, 'full'),
            weekday: formatISTWeekday(s),
            startIST: formatISTTime(s),
            endIST: formatISTTime(e),
            timeIST: `${formatISTTime(s)} – ${formatISTTime(e)}`,
            participants,
            location: evt.location || 'Online / Google Meet',
            link: evt.htmlLink || evt.hangoutLink || '',
          };
        });

        const primaryConflict = conflictingEvents[0];
        const participantStr = primaryConflict.participants.length > 0
          ? ` with ${primaryConflict.participants.join(', ')}`
          : '';

        return {
          success: false,
          overlap: true,
          conflict: true,
          message: `Meeting overlap detected: A meeting is already scheduled on ${primaryConflict.date} from ${primaryConflict.timeIST} titled "${primaryConflict.title}"${participantStr} at ${primaryConflict.location}. Double-booking prevented.`,
          conflictingEvents,
        };
      }

      const defaultLocation = location || 'Google Meet';
      const requestBody = {
        summary,
        description: description || '',
        location: defaultLocation,
        start: {
          dateTime: startIso,
          timeZone: timeZone || 'Asia/Kolkata',
        },
        end: {
          dateTime: endIso,
          timeZone: timeZone || 'Asia/Kolkata',
        },
      };

      if (Array.isArray(attendees) && attendees.length > 0) {
        requestBody.attendees = attendees.filter(Boolean).map((item) => {
          const str = String(item).trim();
          return str.includes('@') ? { email: str } : { displayName: str };
        });
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody,
      });

      const created = response.data;
      const s = parseIndianDate(created.start.dateTime || created.start.date) || new Date(created.start.dateTime || created.start.date);
      const e = parseIndianDate(created.end.dateTime || created.end.date) || new Date(created.end.dateTime || created.end.date);
      const meetingLink = created.hangoutLink || created.htmlLink;

      const finalParticipants = created.attendees
        ? created.attendees.map((a) => a.displayName || a.email)
        : (Array.isArray(attendees) ? attendees : []);

      return {
        success: true,
        eventId: created.id,
        title: created.summary || summary,
        summary: created.summary || summary,
        date: formatIndianDate(s, 'full'),
        weekday: formatISTWeekday(s),
        indianDateFormat: formatIndianDate(s, 'dmy'),
        startIST: formatISTTime(s),
        endIST: formatISTTime(e),
        timeIST: `${formatISTTime(s)} – ${formatISTTime(e)}`,
        location: created.location || defaultLocation,
        participants: finalParticipants,
        withWhom: finalParticipants.length > 0 ? finalParticipants.join(', ') : 'Not specified',
        htmlLink: created.htmlLink,
        hangoutLink: created.hangoutLink || null,
        meetingLink,
        link: meetingLink,
        status: created.status,
      };
    } catch (err) {
      console.error('[CalendarService] Error creating calendar event:', err.message);
      const isApiDisabled =
        err.message?.includes('has not been used in project') ||
        err.message?.includes('it is disabled') ||
        err.message?.includes('Google Calendar API has not been used');
      const projectId = config.google.clientId ? config.google.clientId.split('-')[0] : '210931415970';
      const enableUrl = `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${projectId}`;

      return {
        success: false,
        error: isApiDisabled
          ? `Google Calendar API has not been enabled for project ${projectId}. Enable it by visiting ${enableUrl}`
          : `Google Calendar API error: ${err.message}`,
        message: isApiDisabled
          ? 'Google Calendar API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console.'
          : 'Failed to create calendar event.',
        actionRequired: isApiDisabled ? 'ENABLE_GOOGLE_CALENDAR_API' : undefined,
        enableUrl: isApiDisabled ? enableUrl : undefined,
      };
    }
  },
};
