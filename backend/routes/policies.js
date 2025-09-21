const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');
const { sendPolicyUpdateNotification } = require('../services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

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
router.get('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      include: {
        department: true
      }
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /policies - Create/upload new policy (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), policyUpload.single('document'), async (req, res) => {
  const { title, content, departmentId } = req.body;

  try {
    const policyData = {
      title,
      content,
      departmentId: parseInt(departmentId)
    };

    if (req.file) {
      policyData.filePath = req.file.path;
      policyData.fileName = req.file.originalname;
      policyData.fileSize = req.file.size;
      policyData.mimeType = req.file.mimetype;
    }

    const policy = await prisma.policy.create({
      data: policyData,
      include: {
        department: true
      }
    });

    // Send policy update notifications to all employees in the department
    const departmentUsers = await prisma.user.findMany({
      where: {
        departmentId: policy.departmentId,
        role: 'Employee'
      },
      select: { email: true }
    });

    // Send emails asynchronously
    departmentUsers.forEach(user => {
      sendPolicyUpdateNotification(user.email, policy.title, policy.department.name);
    });

    res.status(201).json({ message: 'Policy created successfully.', policy });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
    }
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /policies/:id - Delete policy (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.policy.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Policy deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Policy not found.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// GET /policies/department - List policies for employee's department (Employee only)
router.get('/department', verifyToken, requireRole(['Employee']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    if (!user || !user.departmentId) {
      return res.status(400).json({ error: 'User department not found.' });
    }

    // Get policies for user's department
    const policies = await prisma.policy.findMany({
      where: {
        departmentId: user.departmentId
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    });

    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;