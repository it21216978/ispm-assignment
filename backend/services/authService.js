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

  async register(name, email, password, role, companyId, departmentId) {
    // Input validation
    if (!name || !email || !password) {
      const error = new Error('Name, email, and password are required.');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (!email.includes('@') || !email.includes('.')) {
      const error = new Error('Invalid email format.');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (password.length < 6) {
      const error = new Error('Password must be at least 6 characters long.');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Determine role: if no company exists, first user is SuperAdmin
    let userRole = role;
    if (!userRole) {
      const existingCompany = await prisma.company.findFirst();
      userRole = existingCompany ? 'Pending' : 'SuperAdmin';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole,
          companyId,
          departmentId
        }
      });

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log(token)
      const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return { token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    } catch (error) {
      if (error.code === 'P2002') {
        const duplicateError = new Error('Email already exists.');
        duplicateError.code = 'DUPLICATE_EMAIL';
        throw duplicateError;
      } else if (error.code.startsWith('P')) {
        const dbError = new Error('Database error occurred.');
        dbError.code = 'DATABASE_ERROR';
        throw dbError;
      } else {
        throw error; // Re-throw unknown errors
      }
    }
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

  async onboardFirstTime(name, email, password) {
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      throw new Error('Company already exists. Please use invitation to join.');
    }

    if (!name || !email || !password) {
      throw new Error('Name, email and password required for first-time setup.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
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

  async wizardUpdateProfile(profileImage, userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImage }
    });

    return user;
  }

  async wizardCreateCompany(name, industry, address, employeeCount, userId) {
    // Check if user already has a company assigned
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (user.companyId) {
      throw new Error('User already has a company assigned.');
    }

    const company = await prisma.company.create({
      data: { name, industry, address, employeeCount }
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

  async onboardSuperAdmin(userId, companyName, departments) {
    // Check if company already exists
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      throw new Error('Company already exists.');
    }

    // Create company
    const company = await prisma.company.create({
      data: { name: companyName }
    });

    // Create departments
    const createdDepartments = [];
    for (const deptName of departments) {
      const dept = await prisma.department.create({
        data: {
          name: deptName,
          companyId: company.id
        }
      });
      createdDepartments.push(dept);
    }

    // Upgrade user to SuperAdmin and assign to company
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'SuperAdmin',
        companyId: company.id
      }
    });

    return {
      message: 'Onboarding completed successfully.',
      company,
      departments: createdDepartments
    };
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