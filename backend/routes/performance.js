const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');
const analyticsService = require('../services/analyticsService');

const router = express.Router();
const prisma = new PrismaClient();

// GET /performance/scores - View all assessment scores (SuperAdmin only)
router.get('/scores', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const results = await prisma.result.findMany({
      include: {
        user: {
          select: { id: true, email: true, department: true }
        },
        assessment: {
          select: { id: true, title: true }
        }
      }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/compliance - View compliance tracking data (SuperAdmin only)
router.get('/compliance', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const complianceData = await prisma.performanceData.findMany({
      where: { compliance: true },
      include: {
        user: {
          select: { id: true, email: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(complianceData);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/non-compliance - View non-compliance data (SuperAdmin only)
router.get('/non-compliance', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const nonComplianceData = await prisma.performanceData.findMany({
      where: { compliance: false },
      include: {
        user: {
          select: { id: true, email: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(nonComplianceData);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/me - View personal performance data (Employee only)
router.get('/me', verifyToken, requireRole(['Employee']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get assessment results
    const results = await prisma.result.findMany({
      where: { userId: userId },
      include: {
        assessment: {
          select: { id: true, title: true }
        }
      }
    });

    // Get performance data
    const performanceData = await prisma.performanceData.findMany({
      where: { userId: userId },
      select: {
        id: true,
        metric: true,
        value: true,
        compliance: true,
        date: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      assessmentResults: results,
      performanceMetrics: performanceData
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/analytics/scores - Get performance scores analytics (SuperAdmin only)
router.get('/analytics/scores', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const scores = await analyticsService.calculatePerformanceScores();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/analytics/compliance - Get compliance percentages (SuperAdmin only)
router.get('/analytics/compliance', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const compliance = await analyticsService.calculateCompliancePercentages();
    res.json(compliance);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /performance/dashboard - Get dashboard statistics (SuperAdmin only)
router.get('/dashboard', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const stats = await analyticsService.generateDashboardStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;