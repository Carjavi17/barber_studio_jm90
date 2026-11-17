import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

// Checks the token and loads the user from the database
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Tu cuenta está desactivada' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Sesión inválida o vencida' });
  }
}

// Allows only the listed roles, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para hacer esto' });
    }
    next();
  };
}

export { authenticate, requireRole };