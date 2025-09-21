const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class AuthService {
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return { token, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }

  async register(email, password, role = 'Employee', companyId, departmentId) {
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

    return { id: user.id, email: user.email, role: user.role };
  }

  async onboardWithInvitation(token, password) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.invitationId) {
      throw new Error('Invalid invitation token.');
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: decoded.invitationId },
      include: { company: true, department: true }
    });

    if (!invitation || invitation.status !== 'Pending') {
      throw new Error('Invalid or expired invitation.');
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

    return {
      token: authToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      redirect: 'dashboard'
    };
  }

  async onboardFirstTime(email, password) {
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      throw new Error('Company already exists. Please use invitation to join.');
    }

    if (!email || !password) {
      throw new Error('Email and password required for first-time setup.');
    }

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

    return {
      token: authToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      redirect: 'onboarding-wizard'
    };
  }

  async registerCompany(name) {
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      throw new Error('Company already exists. Cannot register new company.');
    }

    const company = await prisma.company.create({
      data: { name }
    });

    return company;
  }

  async createDepartment(name, companyId) {
    const department = await prisma.department.create({
      data: {
        name,
        companyId
      }
    });

    return department;
  }

  async createInvitation(email, companyId, departmentId, invitedById) {
    const invitation = await prisma.invitation.create({
      data: {
        email,
        companyId,
        departmentId,
        invitedById
      },
      include: {
        company: true,
        department: true
      }
    });

    const invitationToken = jwt.sign({ invitationId: invitation.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return { invitation, token: invitationToken };
  }

  async wizardCreateCompany(name, userId) {
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      throw new Error('Company already exists.');
    }

    const company = await prisma.company.create({
      data: { name }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id }
    });

    return company;
  }

  async wizardCreateDepartments(departments, companyId) {
    const createdDepartments = [];
    for (const deptName of departments) {
      const dept = await prisma.department.create({
        data: {
          name: deptName,
          companyId
        }
      });
      createdDepartments.push(dept);
    }

    return createdDepartments;
  }

  async getUserById(id) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token required.');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      throw new Error('Invalid refresh token.');
    }

    const newToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return { token: newToken, refreshToken: newRefreshToken };
  }
}

module.exports = new AuthService();