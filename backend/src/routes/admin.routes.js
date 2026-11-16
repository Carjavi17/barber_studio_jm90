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

export default router;