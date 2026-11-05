// Booking business logic utilities

/**
 * Parse time string "HH:MM" to minutes since midnight
 * Supports "07:00", "19:30", "7:00 AM", "7:00 PM" (simple)
 */
export const parseTimeToMinutes = (time: string): number => {
  const trimmed = time.trim().toUpperCase();
  const ampmMatch = trimmed.match(/(AM|PM)/);
  let timePart = trimmed.replace(/(AM|PM)/, '').trim();

  const [hStr, mStr] = timePart.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = mStr ? parseInt(mStr, 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  if (ampmMatch) {
    const isPM = ampmMatch[0] === 'PM';
    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else {
      hours = isPM ? hours + 12 : hours;
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time range: ${time}`);
  }

  return hours * 60 + minutes;
};

export const minutesToTimeString = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Check if two time intervals overlap
 * Overlap condition: newStart < existingEnd AND newEnd > existingStart
 */
export const isOverlapping = (
  newStart: number,
  newEnd: number,
  existingStart: number,
  existingEnd: number
): boolean => {
  return newStart < existingEnd && newEnd > existingStart;
};

export interface DurationCalc {
  durationHours: number;
  durationMinutes: number;
}

export const calculateDuration = (
  startMinutes: number,
  endMinutes: number
): DurationCalc => {
  if (startMinutes >= endMinutes) {
    throw new Error('Start time must be earlier than end time');
  }
  const diff = endMinutes - startMinutes;
  return {
    durationMinutes: diff,
    durationHours: diff / 60,
  };
};

/**
 * Server-side price calculation using integer cents to avoid floating errors
 */
export const calculateBookingPrice = (hourlyRate: number, durationHours: number, securityDeposit: number) => {
  // Use cents
  const rateCents = Math.round(hourlyRate * 100);
  const depositCents = Math.round(securityDeposit * 100);
  const subtotalCents = Math.round(rateCents * durationHours);
  const totalCents = subtotalCents + depositCents;

  return {
    subtotal: subtotalCents / 100,
    totalAmount: totalCents / 100,
    hourlyRateSnapshot: hourlyRate,
    securityDepositSnapshot: securityDeposit,
    duration: durationHours,
  };
};

/**
 * Validate booking date is not in past (YYYY-MM-DD)
 */
export const isValidFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
};

