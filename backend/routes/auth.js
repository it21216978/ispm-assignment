const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Login endpoint
router.post('/login', authController.login);

// Registration endpoint
router.post('/register', authController.register);

// Unified onboarding endpoint
router.post('/onboard', authController.onboard);

// Company registration endpoint (SuperAdmin only, first-time setup)
router.post('/register-company', verifyToken, requireRole(['SuperAdmin']), authController.registerCompany);

// Department creation endpoint (SuperAdmin only)
router.post('/create-department', verifyToken, requireRole(['SuperAdmin']), authController.createDepartment);

// Create invitation endpoint (SuperAdmin only)
router.post('/invite', verifyToken, requireRole(['SuperAdmin']), authController.invite);

// Onboarding wizard: Update profile
router.post('/wizard/profile', verifyToken, requireRole(['SuperAdmin']), authController.wizardProfile);

// Onboarding wizard: Complete company setup
router.post('/wizard/company', verifyToken, requireRole(['SuperAdmin']), authController.wizardCompany);

// Onboarding wizard: Create departments
router.post('/wizard/departments', verifyToken, requireRole(['SuperAdmin']), authController.wizardDepartments);

// Onboarding wizard: Complete setup
router.post('/wizard/complete', verifyToken, requireRole(['SuperAdmin']), authController.wizardComplete);

// Token refresh endpoint
router.post('/refresh', authController.refresh);

module.exports = router;