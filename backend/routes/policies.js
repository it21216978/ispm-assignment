const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const policiesController = require('../controllers/policiesController');

const router = express.Router();

// GET /policies - List all policies (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), policiesController.getAll);

// POST /policies - Create new policy (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), policiesController.create);

// DELETE /policies/:id - Delete policy (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), policiesController.delete);

// GET /policies/department - List policies for employee's department (Employee only)
router.get('/department', verifyToken, requireRole(['Employee']), policiesController.getDepartment);

module.exports = router;