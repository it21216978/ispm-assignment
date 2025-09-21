const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');
const bcrypt = require('bcrypt');

const router = express.Router();
const prisma = new PrismaClient();

// GET /employees - List all employees (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: 'Employee' },
      include: {
        company: true,
        department: true
      }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /employees - Create new employee (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { email, password, companyId, departmentId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'Employee',
        companyId,
        departmentId
      },
      include: {
        company: true,
        department: true
      }
    });

    res.status(201).json({ message: 'Employee created successfully.', employee });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// GET /employees/:id - Get employee by ID (SuperAdmin only)
router.get('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
        department: true
      }
    });

    if (!employee || employee.role !== 'Employee') {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /employees/:id - Update employee (SuperAdmin only)
router.put('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  const { email, companyId, departmentId } = req.body;

  try {
    const employee = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email,
        companyId,
        departmentId
      },
      include: {
        company: true,
        department: true
      }
    });

    res.json({ message: 'Employee updated successfully.', employee });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Employee not found.' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// DELETE /employees/:id - Delete employee (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Employee not found.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

module.exports = router;