const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');

const router = express.Router();
const prisma = new PrismaClient();

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
router.get('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const trainingContents = await prisma.trainingContent.findMany({
      include: {
        policy: true
      }
    });
    res.json(trainingContents);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /training - Create/upload new training content (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), trainingUpload.single('material'), async (req, res) => {
  const { title, content, policyId } = req.body;

  try {
    const trainingData = {
      title,
      content,
      policyId: parseInt(policyId)
    };

    if (req.file) {
      trainingData.filePath = req.file.path;
      trainingData.fileName = req.file.originalname;
      trainingData.fileSize = req.file.size;
      trainingData.mimeType = req.file.mimetype;
    }

    const trainingContent = await prisma.trainingContent.create({
      data: trainingData,
      include: {
        policy: true
      }
    });

    res.status(201).json({ message: 'Training content created successfully.', trainingContent });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
      }
    }
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /training/:id - Delete training content (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.trainingContent.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Training content deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Training content not found.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// GET /training/policy/:policyId - List training contents for a policy (Employee only)
router.get('/policy/:policyId', verifyToken, requireRole(['Employee']), async (req, res) => {
  const { policyId } = req.params;
  const userId = req.user.id;

  try {
    // Check if user has access to this policy (same department)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    const policy = await prisma.policy.findFirst({
      where: {
        id: parseInt(policyId),
        departmentId: user.departmentId
      }
    });

    if (!policy) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const trainingContents = await prisma.trainingContent.findMany({
      where: { policyId: parseInt(policyId) },
      select: {
        id: true,
        title: true,
        content: true,
        filePath: true,
        fileName: true,
        createdAt: true
      }
    });

    res.json(trainingContents);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;