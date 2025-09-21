const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyToken, requireRole } = require('../auth');
const policiesController = require('../controllers/policiesController');

const router = express.Router();

// Multer configuration for policies
const policyUpload = multer({
  dest: 'uploads/policy-documents/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB for documents
});

// GET /policies - List all policies (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), policiesController.getAll);

// POST /policies - Create/upload new policy (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), policyUpload.single('document'), policiesController.create);

// DELETE /policies/:id - Delete policy (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), policiesController.delete);

// GET /policies/department - List policies for employee's department (Employee only)
router.get('/department', verifyToken, requireRole(['Employee']), policiesController.getDepartment);

module.exports = router;