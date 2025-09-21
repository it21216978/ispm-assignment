const trainingService = require('../services/trainingService');

class TrainingController {
  async getAll(req, res) {
    try {
      const trainingContents = await trainingService.getAllTrainingContents();
      res.json(trainingContents);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async create(req, res) {
    const { title, content, policyId } = req.body;

    try {
      const trainingContent = await trainingService.createTrainingContent(title, content, policyId, req.file);
      res.status(201).json({ message: 'Training content created successfully.', trainingContent });
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
      }
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      await trainingService.deleteTrainingContent(id);
      res.json({ message: 'Training content deleted successfully.' });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Training content not found.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async getByPolicy(req, res) {
    const { policyId } = req.params;
    const userId = req.user.id;

    try {
      const trainingContents = await trainingService.getTrainingContentsForPolicy(policyId, userId);
      res.json(trainingContents);
    } catch (error) {
      if (error.code === 'ACCESS_DENIED') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }
}

module.exports = new TrainingController();