import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getFreeSlots } from '../services/slots.js';
import { toShopDate } from '../utils/time.js';

const router = express.Router();

router.use(authenticate);

// Book an appointment (clients only)
router.post('/', requireRole('client'), async (req, res) => {
  const barberId = Number(req.body.barberId);
  const serviceId = Number(req.body.serviceId);
  const startsAt = new Date(req.body.startsAt);

  if (!Number.isInteger(barberId) || !Number.isInteger(serviceId) || Number.isNaN(startsAt.getTime())) {
    return res.status(400).json({ error: 'Servicio, barbero y horario son obligatorios' });
  }

  try {
    const [barber, service] = await Promise.all([
      prisma.user.findFirst({ where: { id: barberId, role: 'barber', isActive: true } }),
      prisma.service.findFirst({ where: { id: serviceId, isActive: true } }),
    ]);
    if (!barber) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // The requested time must be one of the free start times for that service
    const freeSlots = await getFreeSlots(barberId, toShopDate(startsAt), service.durationMinutes);
    const isFree = freeSlots.some((slot) => slot.getTime() === startsAt.getTime());
    if (!isFree) {
      return res.status(409).json({ error: 'Ese horario ya no está disponible' });
    }

    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    // The appointment keeps a copy of the service name and price at booking time
    const appointment = await prisma.appointment.create({
      data: {
        clientId: req.user.id,
        barberId,
        serviceId,
        serviceName: service.name,
        price: service.price,
        startsAt,
        endsAt,
      },
      include: { barber: { select: { id: true, name: true } } },
    });

    res.status(201).json(appointment);
  } catch (error) {
    // Two clients booking overlapping times at the same moment: the database rejects the second.
    // I'm not sure which exact error code Prisma gives for this constraint, so I also check the message.
    if (error.code === 'P2002' || /exclusion|no_overlapping_appointments/i.test(error.message || '')) {
      return res.status(409).json({ error: 'Ese horario ya no está disponible' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// List appointments: each role sees what belongs to it
router.get('/', async (req, res) => {
  const { role, id } = req.user;

  let where = {};
  if (role === 'client') where = { clientId: id };
  if (role === 'barber') where = { barberId: id };

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, name: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Cancel an appointment (its client, its barber, or an admin)
router.patch('/:id/cancel', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const isParticipant =
      appointment.clientId === req.user.id || appointment.barberId === req.user.id;
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(409).json({ error: 'Este turno ya estaba cancelado' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Confirm an appointment (its barber, or an admin)
router.patch('/:id/confirm', requireRole('barber', 'admin'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (req.user.role === 'barber' && appointment.barberId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto' });
    }

    if (appointment.status !== 'pending') {
      return res.status(409).json({ error: 'Solo se pueden confirmar turnos pendientes' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;