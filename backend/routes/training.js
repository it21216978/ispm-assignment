const express = require('express');
const { verifyToken, requireRole } = require('../auth');
const trainingController = require('../controllers/trainingController');

const router = express.Router();

// GET /training - List all training contents (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), trainingController.getAll);

// POST /training - Create new training content (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), trainingController.create);

// DELETE /training/:id - Delete training content (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), trainingController.delete);

// GET /training/policy/:policyId - List training contents for a policy (Employee only)
router.get('/policy/:policyId', verifyToken, requireRole(['Employee']), trainingController.getByPolicy);

module.exports = router;