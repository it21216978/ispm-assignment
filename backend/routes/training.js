const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyToken, requireRole } = require('../auth');
const trainingController = require('../controllers/trainingController');

const router = express.Router();

// Multer configuration for training materials
const trainingUpload = multer({
  dest: 'uploads/training-materials/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|mp4|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type for training material'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for training materials
});

// GET /training - List all training contents (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), trainingController.getAll);

// POST /training - Create/upload new training content (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), trainingUpload.single('material'), trainingController.create);

// DELETE /training/:id - Delete training content (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), trainingController.delete);

// GET /training/policy/:policyId - List training contents for a policy (Employee only)
router.get('/policy/:policyId', verifyToken, requireRole(['Employee']), trainingController.getByPolicy);

module.exports = router;