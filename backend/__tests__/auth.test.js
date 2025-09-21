const jwt = require('jsonwebtoken');
const { verifyToken, requireRole } = require('../auth');

// Mock Prisma
jest.mock('../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn()
    }
  }))
}));

const { PrismaClient } = require('../generated/prisma');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('verifyToken', () => {
    it('should return 401 if no token provided', () => {
      mockReq.header.mockReturnValue(undefined);

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if token is invalid', () => {
      mockReq.header.mockReturnValue('Bearer invalidtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next if token is valid', () => {
      const decoded = { id: 1, email: 'test@example.com' };
      mockReq.header.mockReturnValue('Bearer validtoken');
      jwt.verify = jest.fn().mockReturnValue(decoded);

      verifyToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 403 if user role not in allowed roles', async () => {
      const prisma = new PrismaClient();
      prisma.user.findUnique.mockResolvedValue({ role: 'Employee' });
      mockReq.user = { id: 1 };

      const middleware = requireRole(['Admin']);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next if user has required role', async () => {
      const prisma = new PrismaClient();
      prisma.user.findUnique.mockResolvedValue({ role: 'Admin' });
      mockReq.user = { id: 1 };

      const middleware = requireRole(['Admin']);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.user.role).toBe('Admin');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});