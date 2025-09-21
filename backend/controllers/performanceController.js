const performanceService = require('../services/performanceService');

class PerformanceController {
  async getScores(req, res) {
    try {
      const results = await performanceService.getAllScores();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getCompliance(req, res) {
    try {
      const complianceData = await performanceService.getComplianceData();
      res.json(complianceData);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getNonCompliance(req, res) {
    try {
      const nonComplianceData = await performanceService.getNonComplianceData();
      res.json(nonComplianceData);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getPersonal(req, res) {
    try {
      const userId = req.user.id;
      const performanceData = await performanceService.getPersonalPerformance(userId);
      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getScoreAnalytics(req, res) {
    try {
      const scores = await performanceService.getScoreAnalytics();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getComplianceAnalytics(req, res) {
    try {
      const compliance = await performanceService.getComplianceAnalytics();
      res.json(compliance);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getDashboard(req, res) {
    try {
      const stats = await performanceService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }
}

module.exports = new PerformanceController();