// backend/src/middleware/auth.js
import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// กันพลาด: alias
export const requireAuth = authRequired;
export default authRequired;

