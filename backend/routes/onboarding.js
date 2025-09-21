const express = require('express');
const { verifyToken } = require('../auth');
const onboardingController = require('../controllers/onboardingController');

const router = express.Router();

// Create company and departments, upgrade user to SuperAdmin
router.post('/company', verifyToken, onboardingController.createCompany);

module.exports = router;