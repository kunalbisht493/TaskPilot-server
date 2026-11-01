/**
 * Utility functions for Indian date parsing and formatting.
 * Supports:
 * - YYYY-MM-DD, YYYY/MM/DD (with or without time)
 * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (with or without time, e.g. '23-10-2026', '23-10-2026 14:30', '23-10-2026 at 2:30 pm')
 * - 23 october 2026, 23 oct 2026, 23 oct, 23 october (with or without time)
 * - october 23 2026, oct 23 2026, oct 23, october 23
 * - ISO strings (2026-10-23, 2026-10-23T...)
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // Asia/Kolkata is UTC+05:30

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseTimeParts(hourStr, minStr, secStr, ampm) {
  if (hourStr === undefined || hourStr === null) return null;
  let h = parseInt(hourStr, 10);
  const m = parseInt(minStr || '0', 10);
  const s = parseInt(secStr || '0', 10);
  if (ampm) {
    const isPm = ampm.toLowerCase() === 'pm';
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
  }
  return { h, m, s };
}

/**
 * Creates a Date representing the given year, month, day, hour, min, sec in IST (+05:30).
 * Safe across all server runtime timezones.
 * 
 * @param {number} year 
 * @param {number} monthIndex (0-11)
 * @param {number} day (1-31)
 * @param {number} [hour=0] 
 * @param {number} [minute=0] 
 * @param {number} [second=0] 
 * @param {number} [ms=0] 
 * @returns {Date}
 */
export function createISTDate(year, monthIndex, day, hour = 0, minute = 0, second = 0, ms = 0) {
  const utcMs = Date.UTC(year, monthIndex, day, hour, minute, second, ms) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Returns year, month (0-indexed), day, hours, minutes, seconds of a Date in IST (+05:30).
 * 
 * @param {Date|string|number} date 
 * @returns {{ year: number, month: number, day: number, hours: number, minutes: number, seconds: number, ms: number }}
 */
export function getISTDateParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  const istMs = d.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istMs);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
    seconds: istDate.getUTCSeconds(),
    ms: istDate.getUTCMilliseconds(),
  };
}

/**
 * Checks if a string has an explicit time component.
 * 
 * @param {string|Date|number} input 
 * @returns {boolean}
 */
export function hasExplicitTime(input) {
  if (!input) return false;
  if (input instanceof Date) return true;
  if (typeof input !== 'string') return false;
  const str = input.trim();
  return /(?:\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:am|pm))?\b)|(?:T\d{2}:\d{2})/i.test(str);
}

/**
 * Parses user input in Indian format or standard ISO.
 * @param {string|Date|number} input 
 * @param {number} [defaultYear] 
 * @param {boolean} [defaultEndOfDay=false] - If true and time is omitted, defaults to 23:59:59.999 IST instead of 00:00:00.000 IST
 * @returns {Date|null}
 */
export function parseIndianDate(input, defaultYear = new Date().getFullYear(), defaultEndOfDay = false) {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input !== 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = input.trim();
  if (!str) return null;

  // 0. Check YYYY-MM-DD or YYYY/MM/DD (optional time: ' 14:30', ' at 2:30 pm')
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const time = parseTimeParts(ymdMatch[4], ymdMatch[5], ymdMatch[6], ymdMatch[7]);
    if (time) {
      return createISTDate(year, month, day, time.h, time.m, time.s, 0);
    }
    return defaultEndOfDay
      ? createISTDate(year, month, day, 23, 59, 59, 999)
      : createISTDate(year, month, day, 0, 0, 0, 0);
  }

  // 1. Check DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (optional time: ' 14:30', ' at 2:30 pm')
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const time = parseTimeParts(dmyMatch[4], dmyMatch[5], dmyMatch[6], dmyMatch[7]);
    if (time) {
      return createISTDate(year, month, day, time.h, time.m, time.s, 0);
    }
    return defaultEndOfDay
      ? createISTDate(year, month, day, 23, 59, 59, 999)
      : createISTDate(year, month, day, 0, 0, 0, 0);
  }

  // 2. Check DD-MM-YY, DD/MM/YY
  const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dmyShortMatch) {
    const day = parseInt(dmyShortMatch[1], 10);
    const month = parseInt(dmyShortMatch[2], 10) - 1;
    const year = 2000 + parseInt(dmyShortMatch[3], 10);
    const time = parseTimeParts(dmyShortMatch[4], dmyShortMatch[5], dmyShortMatch[6], dmyShortMatch[7]);
    if (time) {
      return createISTDate(year, month, day, time.h, time.m, time.s, 0);
    }
    return defaultEndOfDay
      ? createISTDate(year, month, day, 23, 59, 59, 999)
      : createISTDate(year, month, day, 0, 0, 0, 0);
  }

  // 3. Check '23 october 2026', '23 oct 2026', '23rd october', '23 oct', etc. (full and short month, optional time)
  const dayMonthYearMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-_/]+([a-zA-Z]+)(?:[\s\-_/]+(\d{4}))?(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1], 10);
    const monthStr = dayMonthYearMatch[2].toLowerCase();
    const year = dayMonthYearMatch[3] ? parseInt(dayMonthYearMatch[3], 10) : defaultYear;
    if (MONTH_MAP[monthStr] !== undefined) {
      const time = parseTimeParts(dayMonthYearMatch[4], dayMonthYearMatch[5], dayMonthYearMatch[6], dayMonthYearMatch[7]);
      if (time) {
        return createISTDate(year, MONTH_MAP[monthStr], day, time.h, time.m, time.s, 0);
      }
      return defaultEndOfDay
        ? createISTDate(year, MONTH_MAP[monthStr], day, 23, 59, 59, 999)
        : createISTDate(year, MONTH_MAP[monthStr], day, 0, 0, 0, 0);
    }
  }

  // 4. Check 'october 23 2026', 'november 2, 2026', 'oct 23', etc. (full and short month, optional time)
  const monthDayYearMatch = str.match(/^([a-zA-Z]+)[\s\-_/]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s\-_/,]+(\d{4}))?(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase();
    const day = parseInt(monthDayYearMatch[2], 10);
    const year = monthDayYearMatch[3] ? parseInt(monthDayYearMatch[3], 10) : defaultYear;
    if (MONTH_MAP[monthStr] !== undefined) {
      const time = parseTimeParts(monthDayYearMatch[4], monthDayYearMatch[5], monthDayYearMatch[6], monthDayYearMatch[7]);
      if (time) {
        return createISTDate(year, MONTH_MAP[monthStr], day, time.h, time.m, time.s, 0);
      }
      return defaultEndOfDay
        ? createISTDate(year, MONTH_MAP[monthStr], day, 23, 59, 59, 999)
        : createISTDate(year, MONTH_MAP[monthStr], day, 0, 0, 0, 0);
    }
  }

  // 5. Standard ISO fallback (e.g. 2026-10-23T14:00:00Z or 2026-10-23T14:00:00+05:30)
  const native = new Date(str);
  if (!isNaN(native.getTime())) {
    if (native.getFullYear() === 2001 && !str.includes('2001')) {
      native.setFullYear(defaultYear);
    }
    return native;
  }

  return null;
}

/**
 * Resolves start and end query bounds for Google Calendar availability.
 * When checking a date (e.g. "November 2, 2026"):
 * - If timeMin is date-only: window starts at 00:00:00.000 IST
 * - If timeMax is omitted or date-only: window ends at 23:59:59.999 IST
 * - If explicit times are provided, exact moments in IST are honored.
 * 
 * @param {string|Date} timeMin 
 * @param {string|Date} [timeMax] 
 * @param {string} [timeZone='Asia/Kolkata'] 
 * @returns {{ minDate: Date, maxDate: Date, isoTimeMin: string, isoTimeMax: string }}
 */
export function resolveCalendarWindow(timeMin, timeMax, timeZone = 'Asia/Kolkata') {
  if (!timeMin) {
    throw new Error('Start date/time (timeMin) is required to resolve calendar window.');
  }

  const minDate = (timeMin instanceof Date && !isNaN(timeMin.getTime()))
    ? timeMin
    : parseIndianDate(timeMin, undefined, false);

  if (!minDate || isNaN(minDate.getTime())) {
    throw new Error(`Invalid start date: "${timeMin}"`);
  }

  let maxDate;
  if (timeMax) {
    maxDate = (timeMax instanceof Date && !isNaN(timeMax.getTime()))
      ? timeMax
      : parseIndianDate(timeMax, undefined, true);

    if (!maxDate || isNaN(maxDate.getTime())) {
      throw new Error(`Invalid end date: "${timeMax}"`);
    }
  } else {
    // If timeMax is omitted: default to end of the minDate day in IST (23:59:59.999 IST)
    const istParts = getISTDateParts(minDate);
    maxDate = createISTDate(istParts.year, istParts.month, istParts.day, 23, 59, 59, 999);
  }

  // Ensure maxDate is strictly after minDate
  if (maxDate.getTime() <= minDate.getTime()) {
    maxDate = new Date(minDate.getTime() + 60 * 60 * 1000);
  }

  return {
    minDate,
    maxDate,
    isoTimeMin: minDate.toISOString(),
    isoTimeMax: maxDate.toISOString(),
  };
}

/**
 * Formats any date into Indian standard format in Asia/Kolkata timezone.
 * @param {string|Date|number} date 
 * @param {'short'|'full'|'dmy'} [style='short'] - 'short' ('23 Oct 2026'), 'full' ('23 October 2026'), 'dmy' ('23-10-2026')
 * @param {boolean} [withTime=false] - whether to include Indian time (e.g. '08:30 pm')
 * @returns {string}
 */
export function formatIndianDate(date, style = 'short', withTime = false) {
  if (!date) return '';
  const d = (date instanceof Date) ? date : (parseIndianDate(date) || new Date(date));
  if (!d || isNaN(d.getTime())) return String(date);

  if (style === 'dmy') {
    const istParts = getISTDateParts(d);
    const day = String(istParts.day).padStart(2, '0');
    const month = String(istParts.month + 1).padStart(2, '0');
    const year = istParts.year;
    const base = `${day}-${month}-${year}`;
    if (!withTime) return base;
    const time = formatISTTime(d, false);
    return `${base}, ${time}`;
  }

  const monthFormat = style === 'full' ? 'long' : 'short';
  const datePart = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: monthFormat,
    year: 'numeric',
  });

  if (!withTime) return datePart;

  const timePart = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Formats a Date or timestamp string into Indian Standard Time (IST), e.g. "03:00 PM IST".
 * @param {string|Date|number} date
 * @param {boolean} [includeTzSuffix=true]
 * @returns {string}
 */
export function formatISTTime(date, includeTzSuffix = true) {
  if (!date) return '';
  const d = date instanceof Date ? date : (parseIndianDate(date) || new Date(date));
  if (!d || isNaN(d.getTime())) return String(date);

  const timeStr = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return includeTzSuffix ? `${timeStr} IST` : timeStr;
}

/**
 * Formats a Date or timestamp into full IST date and time string.
 * e.g. "Saturday, 24 October 2026, 03:00 PM IST"
 * @param {string|Date|number} date
 * @returns {string}
 */
export function formatISTFullDateTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : (parseIndianDate(date) || new Date(date));
  if (!d || isNaN(d.getTime())) return String(date);

  const datePart = d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timePart = formatISTTime(d, true);
  return `${datePart}, ${timePart}`;
}
