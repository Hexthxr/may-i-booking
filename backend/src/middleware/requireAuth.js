// backend/src/middleware/requireAuth.js
import jwt from 'jsonwebtoken';

/**
 * Require a valid JWT in Authorization header ("Bearer <token>").
 * On success sets: req.user = { id, role, username }
 */
export const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized: missing Bearer token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id || payload._id,
      role: payload.role || 'user',
      username: payload.username || payload.name || '',
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
};

/**
 * Gate by role. Example: app.get('/admin', requireAuth, requireRole('admin'), handler)
 */
export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  return next();
};
