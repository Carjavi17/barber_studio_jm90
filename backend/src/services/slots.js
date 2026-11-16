import { prisma } from '../lib/prisma.js';
import config from '../config.js';

// Returns the free slots (as Date objects) for one barber on one date (YYYY-MM-DD)
export async function getFreeSlots(barberId, date) {
  const { OPENING_TIME, CLOSING_TIME, SLOT_MINUTES, SHOP_TIMEZONE } = config;

  const rows = await prisma.$queryRaw`
    SELECT slot
    FROM generate_series(
      (${date}::date + ${OPENING_TIME}::time) AT TIME ZONE ${SHOP_TIMEZONE},
      (${date}::date + ${CLOSING_TIME}::time - make_interval(mins => ${SLOT_MINUTES}::int)) AT TIME ZONE ${SHOP_TIMEZONE},
      make_interval(mins => ${SLOT_MINUTES}::int)
    ) AS slot
    WHERE slot > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.barber_id = ${barberId}::int
          AND a.starts_at = slot
          AND a.status <> 'cancelled'
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocked_slots b
        WHERE (b.barber_id = ${barberId}::int OR b.barber_id IS NULL)
          AND slot >= b.starts_at
          AND slot < b.ends_at
      )
    ORDER BY slot
  `;

  return rows.map((row) => row.slot);
}

// Converts a Date to the shop's local date string (YYYY-MM-DD)
export function toShopDate(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.SHOP_TIMEZONE }).format(date);
}