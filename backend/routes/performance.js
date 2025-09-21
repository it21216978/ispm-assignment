const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const performanceController = require('../controllers/performanceController');

const router = express.Router();

// GET /performance/scores - View all assessment scores (SuperAdmin only)
router.get('/scores', verifyToken, requireRole(['SuperAdmin']), performanceController.getScores);

// GET /performance/compliance - View compliance tracking data (SuperAdmin only)
router.get('/compliance', verifyToken, requireRole(['SuperAdmin']), performanceController.getCompliance);

// GET /performance/non-compliance - View non-compliance data (SuperAdmin only)
router.get('/non-compliance', verifyToken, requireRole(['SuperAdmin']), performanceController.getNonCompliance);

// GET /performance/me - View personal performance data (Employee only)
router.get('/me', verifyToken, requireRole(['Employee']), performanceController.getPersonal);

// GET /performance/analytics/scores - Get performance scores analytics (SuperAdmin only)
router.get('/analytics/scores', verifyToken, requireRole(['SuperAdmin']), performanceController.getScoreAnalytics);

// GET /performance/analytics/compliance - Get compliance percentages (SuperAdmin only)
router.get('/analytics/compliance', verifyToken, requireRole(['SuperAdmin']), performanceController.getComplianceAnalytics);

// GET /performance/dashboard - Get dashboard statistics (SuperAdmin only)
router.get('/dashboard', verifyToken, requireRole(['SuperAdmin']), performanceController.getDashboard);

module.exports = router;