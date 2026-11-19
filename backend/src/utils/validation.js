import config from '../config.js';

export const MAX_DURATION = 240;
export const MAX_COMMENT = 500;

// Validates the fields that were sent. With requireAll, name, duration and price are mandatory.
// Returns { data } when valid, or { error } with a message in Spanish.
export function validateService(body, { requireAll }) {
  const data = {};

  if (body.name !== undefined || requireAll) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return { error: 'El nombre es obligatorio' };
    }
    data.name = body.name.trim();
  }
  if (body.durationMinutes !== undefined || requireAll) {
    const duration = body.durationMinutes;
    if (!Number.isInteger(duration) || duration <= 0 || duration > MAX_DURATION || duration % config.SLOT_MINUTES !== 0) {
      return { error: `La duración debe ser múltiplo de ${config.SLOT_MINUTES} minutos (máximo ${MAX_DURATION})` };
    }
    data.durationMinutes = duration;
  }
  if (body.price !== undefined || requireAll) {
    const price = body.price;
    if (!Number.isInteger(price) || price < 0) {
      return { error: 'El precio debe ser un número entero de pesos' };
    }
    data.price = price;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return { error: 'El valor isActive debe ser true o false' };
    }
    data.isActive = body.isActive;
  }

  return { data };
}

// Returns an error message, or null when rating and comment are valid
export function validateReview(rating, comment) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'La calificación debe ser de 1 a 5 estrellas';
  }
  if (comment.length > MAX_COMMENT) {
    return `El comentario no puede superar los ${MAX_COMMENT} caracteres`;
  }
  return null;
}
