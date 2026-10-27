/**
 * Utility functions for Indian date parsing and formatting.
 * Supports:
 * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (with or without time, e.g. '23-10-2026', '23-10-2026 14:30', '23-10-2026 at 2:30 pm')
 * - 23 october 2026, 23 oct 2026, 23 oct, 23 october (with or without time)
 * - october 23 2026, oct 23 2026, oct 23, october 23
 * - ISO strings (2026-10-23, 2026-10-23T...)
 */

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
 * Parses user input in Indian format or standard ISO.
 * @param {string|Date|number} input 
 * @param {number} [defaultYear] 
 * @returns {Date|null}
 */
export function parseIndianDate(input, defaultYear = new Date().getFullYear()) {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input !== 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = input.trim();
  if (!str) return null;

  // 1. Check DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (optional time: ' 14:30', ' at 2:30 pm')
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const time = parseTimeParts(dmyMatch[4], dmyMatch[5], dmyMatch[6], dmyMatch[7]);
    const d = time ? new Date(year, month, day, time.h, time.m, time.s) : new Date(year, month, day, 23, 59, 59);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Check DD-MM-YY, DD/MM/YY
  const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dmyShortMatch) {
    const day = parseInt(dmyShortMatch[1], 10);
    const month = parseInt(dmyShortMatch[2], 10) - 1;
    const year = 2000 + parseInt(dmyShortMatch[3], 10);
    const time = parseTimeParts(dmyShortMatch[4], dmyShortMatch[5], dmyShortMatch[6], dmyShortMatch[7]);
    const d = time ? new Date(year, month, day, time.h, time.m, time.s) : new Date(year, month, day, 23, 59, 59);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Check '23 october 2026', '23 oct 2026', '23rd october', '23 oct', etc. (full and short month, optional time)
  const dayMonthYearMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-_/]+([a-zA-Z]+)(?:[\s\-_/]+(\d{4}))?(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (dayMonthYearMatch) {
    const day = parseInt(dayMonthYearMatch[1], 10);
    const monthStr = dayMonthYearMatch[2].toLowerCase();
    const year = dayMonthYearMatch[3] ? parseInt(dayMonthYearMatch[3], 10) : defaultYear;
    if (MONTH_MAP[monthStr] !== undefined) {
      const time = parseTimeParts(dayMonthYearMatch[4], dayMonthYearMatch[5], dayMonthYearMatch[6], dayMonthYearMatch[7]);
      const d = time ? new Date(year, MONTH_MAP[monthStr], day, time.h, time.m, time.s) : new Date(year, MONTH_MAP[monthStr], day, 23, 59, 59);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 4. Check 'october 23 2026', 'oct 23', etc. (full and short month, optional time)
  const monthDayYearMatch = str.match(/^([a-zA-Z]+)[\s\-_/]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s\-_/,]+(\d{4}))?(?:[\s,T]+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?$/i);
  if (monthDayYearMatch) {
    const monthStr = monthDayYearMatch[1].toLowerCase();
    const day = parseInt(monthDayYearMatch[2], 10);
    const year = monthDayYearMatch[3] ? parseInt(monthDayYearMatch[3], 10) : defaultYear;
    if (MONTH_MAP[monthStr] !== undefined) {
      const time = parseTimeParts(monthDayYearMatch[4], monthDayYearMatch[5], monthDayYearMatch[6], monthDayYearMatch[7]);
      const d = time ? new Date(year, MONTH_MAP[monthStr], day, time.h, time.m, time.s) : new Date(year, MONTH_MAP[monthStr], day, 23, 59, 59);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 5. Standard ISO fallback (e.g. 2026-10-23T... or 2026-10-23)
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
 * Formats any date into Indian standard format.
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
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const base = `${day}-${month}-${year}`;
    if (!withTime) return base;
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${base}, ${time}`;
  }

  const monthFormat = style === 'full' ? 'long' : 'short';
  const datePart = d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: monthFormat,
    year: 'numeric',
  });

  if (!withTime) return datePart;

  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}
