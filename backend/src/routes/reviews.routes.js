import express from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { reviewSelect, toDto } from '../services/reviews.js';

const router = express.Router();

router.use(authenticate);

const MAX_COMMENT = 500;

// Returns an error message, or null when rating and comment are valid
function validateReview(rating, comment) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'La calificación debe ser de 1 a 5 estrellas';
  }
  if (comment.length > MAX_COMMENT) {
    return `El comentario no puede superar los ${MAX_COMMENT} caracteres`;
  }
  return null;
}

const readComment = (body) => (typeof body.comment === 'string' ? body.comment.trim() : '');

// Visible reviews with the average (everyone who is logged in)
router.get('/', async (req, res) => {
  try {
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { isVisible: true },
        select: reviewSelect,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.review.aggregate({
        where: { isVisible: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    res.json({
      summary: { average: stats._avg.rating, count: stats._count._all },
      reviews: reviews.map((r) => toDto(r, req.user.id)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Past appointments of this client that don't have a review yet
router.get('/pending', requireRole('client'), async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: req.user.id,
        status: { not: 'cancelled' },
        endsAt: { lt: new Date() },
        review: { is: null },
      },
      select: {
        id: true,
        serviceName: true,
        startsAt: true,
        barber: { select: { name: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 10,
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Write a review for one of your past appointments
router.post('/', requireRole('client'), async (req, res) => {
  const appointmentId = Number(req.body.appointmentId);
  const rating = Number(req.body.rating);
  const comment = readComment(req.body);

  if (!Number.isInteger(appointmentId)) {
    return res.status(400).json({ error: 'Turno inválido' });
  }
  const invalid = validateReview(rating, comment);
  if (invalid) {
    return res.status(400).json({ error: invalid });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clientId: req.user.id },
    });
    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }
    if (appointment.status === 'cancelled' || appointment.endsAt > new Date()) {
      return res.status(409).json({ error: 'Solo puedes calificar turnos que ya pasaron' });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId,
        clientId: req.user.id,
        barberId: appointment.barberId,
        rating,
        comment: comment || null,
      },
      select: reviewSelect,
    });

    res.status(201).json(toDto(review, req.user.id));
  } catch (error) {
    // The appointment already has a review (appointmentId is unique)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ya calificaste este turno' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Edit your own review
router.patch('/:id', requireRole('client'), async (req, res) => {
  const id = Number(req.params.id);
  const rating = Number(req.body.rating);
  const comment = readComment(req.body);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  const invalid = validateReview(rating, comment);
  if (invalid) {
    return res.status(400).json({ error: invalid });
  }

  try {
    const existing = await prisma.review.findUnique({ where: { id } });
    // Someone else's review looks the same as a missing one
    if (!existing || existing.clientId !== req.user.id) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { rating, comment: comment || null },
      select: reviewSelect,
    });

    res.json(toDto(review, req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

export default router;