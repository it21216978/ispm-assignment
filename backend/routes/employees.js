const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const employeesController = require('../controllers/employeesController');

const router = express.Router();

// GET /employees - List all employees (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), employeesController.getAll);

// POST /employees - Create new employee (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), employeesController.create);

// GET /employees/:id - Get employee by ID (SuperAdmin only)
router.get('/:id', verifyToken, requireRole(['SuperAdmin']), employeesController.getById);

// PUT /employees/:id - Update employee (SuperAdmin only)
router.put('/:id', verifyToken, requireRole(['SuperAdmin']), employeesController.update);

// DELETE /employees/:id - Delete employee (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), employeesController.delete);

module.exports = router;