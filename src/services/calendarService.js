import { google } from 'googleapis';
import { getAuthenticatedClientForUser } from './googleAuthService.js';

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
   * @param {string} [params.timeZone] - Optional timezone string (e.g. 'UTC', 'Asia/Kolkata')
   */
  async checkAvailability({ user, timeMin, timeMax, timeZone }) {
    if (!user || (!user.googleTokens?.accessToken && !user.googleTokens?.refreshToken)) {
      return {
        isConnected: false,
        message: 'Google Calendar is not connected. User must sign in via Google OAuth to access calendar data.',
      };
    }

    try {
      const auth = await getAuthenticatedClientForUser(user);
      const calendar = google.calendar({ version: 'v3', auth });

      // Normalize time bounds
      const minDate = new Date(timeMin);
      if (isNaN(minDate.getTime())) {
        throw new Error(`Invalid start date: "${timeMin}"`);
      }

      let maxDate;
      if (timeMax) {
        maxDate = new Date(timeMax);
        if (isNaN(maxDate.getTime())) {
          throw new Error(`Invalid end date: "${timeMax}"`);
        }
      } else {
        // Default to end of the day for timeMin (23:59:59.999)
        maxDate = new Date(minDate);
        maxDate.setHours(23, 59, 59, 999);
      }

      const isoTimeMin = minDate.toISOString();
      const isoTimeMax = maxDate.toISOString();

      // Query Google Calendar Events API
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: isoTimeMin,
        timeMax: isoTimeMax,
        singleEvents: true,
        orderBy: 'startTime',
        ...(timeZone ? { timeZone } : {}),
      });

      const items = response.data.items || [];

      // Format events for clear agent consumption
      const events = items.map((evt) => ({
        id: evt.id,
        summary: evt.summary || '(No Title)',
        description: evt.description || '',
        start: evt.start.dateTime || evt.start.date,
        end: evt.end.dateTime || evt.end.date,
        isAllDay: !evt.start.dateTime,
        status: evt.status,
      }));

      // Extract busy blocks
      const busySlots = events.map((e) => ({
        summary: e.summary,
        from: e.start,
        to: e.end,
      }));

      return {
        isConnected: true,
        timeWindow: {
          start: isoTimeMin,
          end: isoTimeMax,
          timeZone: timeZone || 'UTC',
        },
        hasConflicts: events.length > 0,
        totalEvents: events.length,
        events,
        busySlots,
        summary:
          events.length === 0
            ? 'The user is completely free with no scheduled events during this window.'
            : `The user has ${events.length} event(s) scheduled during this window: ${events.map((e) => `"${e.summary}" (${e.start} to ${e.end})`).join(', ')}.`,
      };
    } catch (err) {
      console.error('[CalendarService] Error querying availability:', err.message);
      return {
        isConnected: true,
        error: `Google Calendar API error: ${err.message}`,
        message: 'Failed to fetch calendar availability from Google.',
      };
    }
  },
};
