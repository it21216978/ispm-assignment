const authService = require('../services/authService');

class OnboardingController {
  async createCompany(req, res) {
    try {
      const { companyName, departments } = req.body;

      // Ensure user is authenticated and has Pending role
      if (req.user.role !== 'Pending') {
        return res.status(403).json({ error: 'Access denied. User must be in Pending status.' });
      }

      const result = await authService.onboardSuperAdmin(req.user.id, companyName, departments);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new OnboardingController();