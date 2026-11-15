const jwt = require('jsonwebtoken');
const pool = require('../db');

// Checks the token and loads the user from the database
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [payload.id]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada' });
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

module.exports = { authenticate, requireRole };