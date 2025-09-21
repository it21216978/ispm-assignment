const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Get dashboard stats (SuperAdmin only)
router.get('/dashboard', verifyToken, requireRole(['SuperAdmin']), adminController.getDashboard);

module.exports = router;