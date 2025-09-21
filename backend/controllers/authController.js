const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async register(req, res) {
    try {
      console.log('Registration request received:', req.body);
      const { name, email, password } = req.body;
      const result = await authService.register(name, email, password);
      console.log('Registration successful for:', email);
      res.status(201).json(result);
    } catch (error) {
      console.error('Registration error:', error.message);
      if (error.code === 'VALIDATION_ERROR') {
        res.status(400).json({ error: error.message });
      } else if (error.code === 'DUPLICATE_EMAIL') {
        res.status(400).json({ error: error.message });
      } else if (error.code === 'DATABASE_ERROR') {
        res.status(500).json({ error: 'Database error occurred. Please try again later.' });
      } else {
        res.status(500).json({ error: 'Internal server error.' });
      }
    }
  }

  async onboard(req, res) {
    try {
      const { token, password, email, name } = req.body;

      if (token) {
        const result = await authService.onboardWithInvitation(token, password);
        res.json(result);
      } else {
        const result = await authService.onboardFirstTime(name, email, password);
        res.json(result);
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async registerCompany(req, res) {
    try {
      const { name } = req.body;
      const company = await authService.registerCompany(name);
      res.status(201).json({ message: 'Company registered successfully.', company });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async createDepartment(req, res) {
    try {
      const { name, companyId } = req.body;
      const department = await authService.createDepartment(name, companyId);
      res.status(201).json({ message: 'Department created successfully.', department });
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async invite(req, res) {
    try {
      const { email, companyId, departmentId } = req.body;
      const { invitation, token } = await authService.createInvitation(email, companyId, departmentId, req.user.id);
      res.json({ message: 'Invitation created.', token });
    } catch (error) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Invitation already exists for this email.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async wizardProfile(req, res) {
    try {
      const { profileImage } = req.body;
      const user = await authService.wizardUpdateProfile(profileImage, req.user.id);
      res.json({ message: 'Profile updated successfully.', user, nextStep: 'company-details' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async wizardCompany(req, res) {
    try {
      const { name, industry, address, employeeCount } = req.body;
      const company = await authService.wizardCreateCompany(name, industry, address, employeeCount, req.user.id);
      res.json({ message: 'Company created successfully.', company, nextStep: 'create-departments' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async wizardDepartments(req, res) {
    try {
      const { departments } = req.body;
      const user = await authService.getUserById(req.user.id);
      if (!user.companyId) {
        return res.status(400).json({ error: 'Company not set up yet.' });
      }

      const createdDepartments = await authService.wizardCreateDepartments(departments, user.companyId);
      res.json({ message: 'Departments created successfully.', departments: createdDepartments, nextStep: 'invite-employees' });
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async wizardComplete(req, res) {
    try {
      res.json({ message: 'Onboarding completed successfully.', redirect: 'dashboard' });
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();