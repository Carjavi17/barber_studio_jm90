import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import config from '../config.js';

const router = express.Router();
const ROLES = ['client', 'barber', 'admin'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// Every route in this file requires an admin
router.use(authenticate, requireRole('admin'));

// Create a barber
router.post('/barbers', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

    if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
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

// Block days (whole days) or hours (one day). Dates and times are in the shop's time zone.
// Without barberId, the whole shop is closed.
router.post('/blocked-slots', async (req, res) => {
  const { startDate, endDate, startTime, endTime, reason } = req.body;
  const barberId = req.body.barberId == null ? null : Number(req.body.barberId);
  const allDay = !startTime && !endTime;

  if (!DATE_RE.test(startDate || '') || !DATE_RE.test(endDate || '')) {
    return res.status(400).json({ error: 'Las fechas deben tener el formato AAAA-MM-DD' });
  }
  if (!allDay && (!TIME_RE.test(startTime || '') || !TIME_RE.test(endTime || ''))) {
    return res.status(400).json({ error: 'Las horas deben tener el formato HH:MM' });
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

    // A whole-day block runs from 00:00 of the first day to 00:00 of the day after the last
    const from = allDay ? '00:00' : startTime;
    const to = allDay ? '00:00' : endTime;
    const extraDays = allDay ? 1 : 0;
    const { SHOP_TIMEZONE } = config;

    const [range] = await prisma.$queryRaw`
      SELECT
        to_char(((${startDate}::date + ${from}::time) AT TIME ZONE ${SHOP_TIMEZONE}) AT TIME ZONE 'UTC',
                'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS starts_at,
        to_char(((${endDate}::date + ${extraDays}::int + ${to}::time) AT TIME ZONE ${SHOP_TIMEZONE}) AT TIME ZONE 'UTC',
                'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS ends_at
    `;
    const startsAt = new Date(range.starts_at);
    const endsAt = new Date(range.ends_at);

    if (endsAt <= startsAt) {
      return res.status(400).json({ error: 'El fin del bloqueo debe ser posterior al inicio' });
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

// Edit a client or barber. The password is optional: send it only to change it.
router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, email, password } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }

  // Build the update only with the fields that were sent and are valid
  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    data.name = name.trim();
  }
  if (phone !== undefined) {
    data.phone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'El correo no es válido' });
    }
    data.email = email.trim().toLowerCase();
  }
  if (password) {
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No hay cambios para guardar' });
  }

  try {
    // Admins can't be edited from the app
    const user = await prisma.user.findFirst({ where: { id, role: { not: 'admin' } } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;