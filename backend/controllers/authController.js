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
      const { email, password, role = 'Employee', companyId, departmentId } = req.body;
      const user = await authService.register(email, password, role, companyId, departmentId);
      res.status(201).json({ message: 'User registered successfully.', user });
    } catch (error) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Email already exists.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async onboard(req, res) {
    try {
      const { token, password, email } = req.body;

      if (token) {
        const result = await authService.onboardWithInvitation(token, password);
        res.json(result);
      } else {
        const result = await authService.onboardFirstTime(email, password);
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

  async wizardCompany(req, res) {
    try {
      const { name } = req.body;
      const company = await authService.wizardCreateCompany(name, req.user.id);
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