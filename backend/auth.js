const jwt = require('jsonwebtoken');
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  };
};

module.exports = { verifyToken, requireRole };