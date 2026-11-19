import { prisma } from '../lib/prisma.js';
import config from '../config.js';

// Free start times (Date objects) for one barber on one date (YYYY-MM-DD),
// for a service that lasts durationMinutes
export async function getFreeSlots(barberId, date, durationMinutes) {
  const { OPENING_TIME, CLOSING_TIME, SLOT_MINUTES, SHOP_TIMEZONE } = config;

  // A start time is free when the whole appointment fits before closing and
  // doesn't overlap another appointment or a block (back-to-back is allowed)
  const rows = await prisma.$queryRaw`
    SELECT to_char(slot AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS slot_utc
    FROM generate_series(
      (${date}::date + ${OPENING_TIME}::time) AT TIME ZONE ${SHOP_TIMEZONE},
      (${date}::date + ${CLOSING_TIME}::time - make_interval(mins => ${durationMinutes}::int)) AT TIME ZONE ${SHOP_TIMEZONE},
      make_interval(mins => ${SLOT_MINUTES}::int)
    ) AS slot
    WHERE slot > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.barber_id = ${barberId}::int
          AND a.status <> 'cancelled'
          AND tstzrange(a.starts_at, a.ends_at)
              && tstzrange(slot, slot + make_interval(mins => ${durationMinutes}::int))
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocked_slots b
        WHERE (b.barber_id = ${barberId}::int OR b.barber_id IS NULL)
          AND tstzrange(b.starts_at, b.ends_at)
              && tstzrange(slot, slot + make_interval(mins => ${durationMinutes}::int))
      )
    ORDER BY slot
  `;

  return rows.map((row) => new Date(row.slot_utc));
}
