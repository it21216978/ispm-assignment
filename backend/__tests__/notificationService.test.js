const nodemailer = require('nodemailer');
const { sendInvitationEmail, sendAssessmentReminder, sendPolicyUpdateNotification } = require('../services/notificationService');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    verify: jest.fn(),
    sendMail: jest.fn()
  })
}));

// Mock Prisma
jest.mock('../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    notification: {
      create: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }))
}));

const { PrismaClient } = require('../generated/prisma');

describe('Notification Service', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = nodemailer.createTransporter();
    process.env.EMAIL_FROM = 'test@example.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email successfully', async () => {
      const prisma = new PrismaClient();
      mockTransporter.sendMail.mockResolvedValue(true);
      prisma.notification.create.mockResolvedValue({});

      const result = await sendInvitationEmail('user@example.com', 'token123', 'Test Company', 'IT Department');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Invitation to join Test Company',
        html: expect.stringContaining('Test Company')
      });
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false on email send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const result = await sendInvitationEmail('user@example.com', 'token123', 'Test Company', 'IT Department');

      expect(result).toBe(false);
    });
  });

  describe('sendAssessmentReminder', () => {
    it('should send assessment reminder successfully', async () => {
      const prisma = new PrismaClient();
      mockTransporter.sendMail.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.notification.create.mockResolvedValue({});

      const result = await sendAssessmentReminder('user@example.com', 'Test Assessment', new Date());

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Assessment Reminder: Test Assessment',
        html: expect.stringContaining('Test Assessment')
      });
      expect(result).toBe(true);
    });
  });

  describe('sendPolicyUpdateNotification', () => {
    it('should send policy update notification successfully', async () => {
      const prisma = new PrismaClient();
      mockTransporter.sendMail.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.notification.create.mockResolvedValue({});

      const result = await sendPolicyUpdateNotification('user@example.com', 'New Policy', 'IT Department');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Policy Update: New Policy',
        html: expect.stringContaining('New Policy')
      });
      expect(result).toBe(true);
    });
  });
});