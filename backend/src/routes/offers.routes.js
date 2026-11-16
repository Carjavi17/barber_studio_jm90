import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Active offers, newest first
router.get('/', async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      select: { id: true, imageUrl: true, title: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(offers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;
