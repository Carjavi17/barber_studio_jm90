import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import config from '../config.js';

const router = express.Router();

router.use(authenticate);

// List active barbers
router.get('/', async (req, res) => {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: 'barber', isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(barbers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Free slots for one barber on one date: /barbers/3/slots?date=2026-11-16
router.get('/:id/slots', async (req, res) => {
  const barberId = Number(req.params.id);
  const { date } = req.query;

  if (!Number.isInteger(barberId)) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return res.status(400).json({ error: 'La fecha debe tener el formato AAAA-MM-DD' });
  }

  try {
    const barber = await prisma.user.findFirst({
      where: { id: barberId, role: 'barber', isActive: true },
    });
    if (!barber) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

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

    res.json(rows.map((row) => row.slot));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;