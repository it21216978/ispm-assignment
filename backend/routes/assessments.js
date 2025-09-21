const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const assessmentsController = require('../controllers/assessmentsController');

const router = express.Router();

// GET /assessments - List all assessments (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), assessmentsController.getAll);

// POST /assessments - Create new assessment (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), assessmentsController.create);

// POST /assessments/:id/questions - Add question to assessment (SuperAdmin only)
router.post('/:id/questions', verifyToken, requireRole(['SuperAdmin']), assessmentsController.addQuestion);

// PUT /assessments/:id/schedule - Schedule the assessment (SuperAdmin only)
router.put('/:id/schedule', verifyToken, requireRole(['SuperAdmin']), assessmentsController.schedule);

// DELETE /assessments/:id - Delete assessment (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), assessmentsController.delete);

// GET /assessments/:id/questions - List questions for an assessment (SuperAdmin only)
router.get('/:id/questions', verifyToken, requireRole(['SuperAdmin']), assessmentsController.getQuestions);

// GET /assessments/available - List available assessments for employee (Employee only)
router.get('/available', verifyToken, requireRole(['Employee']), assessmentsController.getAvailable);

// POST /assessments/:id/submit - Submit assessment answers (Employee only)
router.post('/:id/submit', verifyToken, requireRole(['Employee']), assessmentsController.submit);

module.exports = router;