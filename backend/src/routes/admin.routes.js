import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

const ROLES = ['client', 'barber', 'admin'];

// Every route in this file requires an admin
router.use(authenticate, requireRole('admin'));

// Create a barber
router.post('/barbers', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const barber = await prisma.user.create({
      data: { name, email: email.toLowerCase(), phone, passwordHash, role: 'barber' },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json(barber);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// List users by role: /admin/users?role=barber
router.get('/users', async (req, res) => {
  const role = req.query.role || 'client';

  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Activate or deactivate a user
router.patch('/users/:id/active', async (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'El valor isActive debe ser true o false' });
  }

  try {
    // Admins can't be deactivated
    const user = await prisma.user.findFirst({
      where: { id, role: { not: 'admin' } },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, role: true, isActive: true },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------- Blocked slots (rest days, vacations) ----------

// Block a range of time. Without barberId, the whole shop is closed.
router.post('/blocked-slots', async (req, res) => {
  const startsAt = new Date(req.body.startsAt);
  const endsAt = new Date(req.body.endsAt);
  const { reason } = req.body;
  const barberId = req.body.barberId == null ? null : Number(req.body.barberId);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias' });
  }
  if (endsAt <= startsAt) {
    return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' });
  }
  if (barberId !== null && !Number.isInteger(barberId)) {
    return res.status(400).json({ error: 'Id de barbero inválido' });
  }

  try {
    if (barberId !== null) {
      const barber = await prisma.user.findFirst({ where: { id: barberId, role: 'barber' } });
      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }
    }

    const blockedSlot = await prisma.blockedSlot.create({
      data: { barberId, startsAt, endsAt, reason },
    });

    // Appointments already booked inside the block are NOT cancelled automatically
    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        status: { not: 'cancelled' },
        startsAt: { gte: startsAt, lt: endsAt },
        ...(barberId !== null && { barberId }),
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, name: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    res.status(201).json({ blockedSlot, affectedAppointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// List current and upcoming blocks
router.get('/blocked-slots', async (req, res) => {
  try {
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: { endsAt: { gte: new Date() } },
      include: { barber: { select: { id: true, name: true } } },
      orderBy: { startsAt: 'asc' },
    });
    res.json(blockedSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Remove a block (the slots become free again)
router.delete('/blocked-slots/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  try {
    await prisma.blockedSlot.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    // P2025 = record not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Bloqueo no encontrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------- Offers ----------

router.post('/offers', async (req, res) => {
  const { imageUrl, title } = req.body;

  if (!/^https?:\/\//.test(imageUrl || '')) {
    return res.status(400).json({ error: 'La imagen debe ser una dirección web (http o https)' });
  }

  try {
    const offer = await prisma.offer.create({ data: { imageUrl, title } });
    res.status(201).json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// All offers, including inactive ones
router.get('/offers', async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(offers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Show or hide an offer
router.patch('/offers/:id/active', async (req, res) => {
  const id = Number(req.params.id);
  const { isActive } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'El valor isActive debe ser true o false' });
  }

  try {
    const offer = await prisma.offer.update({ where: { id }, data: { isActive } });
    res.json(offer);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;