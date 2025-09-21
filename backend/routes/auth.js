const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');
const { sendInvitationEmail } = require('../services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Registration endpoint (SuperAdmin only)
router.post('/register', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { email, password, role = 'Employee', companyId, departmentId } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        companyId,
        departmentId
      }
    });

    res.status(201).json({ message: 'User registered successfully.', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// Unified onboarding endpoint
router.post('/onboard', async (req, res) => {
  const { token, password, email } = req.body;

  try {
    if (token) {
      // Onboarding via invitation token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.invitationId) {
        return res.status(400).json({ error: 'Invalid invitation token.' });
      }

      const invitation = await prisma.invitation.findUnique({
        where: { id: decoded.invitationId },
        include: { company: true, department: true }
      });

      if (!invitation || invitation.status !== 'Pending') {
        return res.status(400).json({ error: 'Invalid or expired invitation.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          role: 'Employee',
          companyId: invitation.companyId,
          departmentId: invitation.departmentId
        }
      });

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'Accepted' }
      });

      const authToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token: authToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
        redirect: 'dashboard' // Redirect to employee dashboard
      });
    } else {
      // Check if company exists
      const existingCompany = await prisma.company.findFirst();
      if (!existingCompany) {
        // No company exists, start onboarding wizard
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password required for first-time setup.' });
        }

        // Create SuperAdmin user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'SuperAdmin'
          }
        });

        const authToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
          token: authToken,
          refreshToken,
          user: { id: user.id, email: user.email, role: user.role },
          redirect: 'onboarding-wizard' // Start company setup wizard
        });
      } else {
        return res.status(400).json({ error: 'Company already exists. Please use invitation to join.' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Company registration endpoint (SuperAdmin only, first-time setup)
router.post('/register-company', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { name } = req.body;

  try {
    // Check if any company already exists
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      return res.status(400).json({ error: 'Company already exists. Cannot register new company.' });
    }

    const company = await prisma.company.create({
      data: { name }
    });

    res.status(201).json({ message: 'Company registered successfully.', company });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Department creation endpoint (SuperAdmin only)
router.post('/create-department', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { name, companyId } = req.body;

  try {
    const department = await prisma.department.create({
      data: {
        name,
        companyId
      }
    });

    res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create invitation endpoint (SuperAdmin only)
router.post('/invite', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { email, companyId, departmentId } = req.body;

  try {
    const invitation = await prisma.invitation.create({
      data: {
        email,
        companyId,
        departmentId,
        invitedById: req.user.id
      },
      include: {
        company: true,
        department: true
      }
    });

    // Generate invitation token
    const invitationToken = jwt.sign({ invitationId: invitation.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Send invitation email
    const emailSent = await sendInvitationEmail(
      email,
      invitationToken,
      invitation.company.name,
      invitation.department.name
    );

    if (!emailSent) {
      // Email failed, but invitation was created
      console.warn('Invitation created but email failed to send');
    }

    res.json({ message: 'Invitation sent.', token: invitationToken });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Invitation already exists for this email.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// Onboarding wizard: Complete company setup
router.post('/wizard/company', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { name } = req.body;

  try {
    // Check if company already exists
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      return res.status(400).json({ error: 'Company already exists.' });
    }

    const company = await prisma.company.create({
      data: { name }
    });

    // Update SuperAdmin with companyId
    await prisma.user.update({
      where: { id: req.user.id },
      data: { companyId: company.id }
    });

    res.json({ message: 'Company created successfully.', company, nextStep: 'create-departments' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Onboarding wizard: Create departments
router.post('/wizard/departments', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { departments } = req.body; // Array of department names

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { companyId: true }
    });

    if (!user.companyId) {
      return res.status(400).json({ error: 'Company not set up yet.' });
    }

    const createdDepartments = [];
    for (const deptName of departments) {
      const dept = await prisma.department.create({
        data: {
          name: deptName,
          companyId: user.companyId
        }
      });
      createdDepartments.push(dept);
    }

    res.json({ message: 'Departments created successfully.', departments: createdDepartments, nextStep: 'invite-employees' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Onboarding wizard: Complete setup
router.post('/wizard/complete', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    // Mark setup as complete, perhaps update user or add a flag
    // For now, just return success
    res.json({ message: 'Onboarding completed successfully.', redirect: 'dashboard' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const newToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

module.exports = router;