const policiesService = require('../services/policiesService');

class PoliciesController {
  async getAll(req, res) {
    try {
      const policies = await policiesService.getAllPolicies();
      res.json(policies);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async create(req, res) {
    const { title, content, departmentId } = req.body;

    try {
      const policy = await policiesService.createPolicy(title, content, departmentId, req.file);
      res.status(201).json({ message: 'Policy created successfully.', policy });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
      }
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      await policiesService.deletePolicy(id);
      res.json({ message: 'Policy deleted successfully.' });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Policy not found.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async getDepartment(req, res) {
    try {
      const policies = await policiesService.getDepartmentPolicies(req.user.id);
      res.json(policies);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new PoliciesController();