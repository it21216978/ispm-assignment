const assessmentsService = require('../services/assessmentsService');

class AssessmentsController {
  async getAll(req, res) {
    try {
      const assessments = await assessmentsService.getAllAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async create(req, res) {
    const { title, policyId } = req.body;

    try {
      const assessment = await assessmentsService.createAssessment(title, policyId);
      res.status(201).json({ message: 'Assessment created successfully.', assessment });
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async addQuestion(req, res) {
    const { id } = req.params;
    const { text } = req.body;

    try {
      const question = await assessmentsService.addQuestionToAssessment(id, text);
      res.status(201).json({ message: 'Question added successfully.', question });
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async schedule(req, res) {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    try {
      const assessment = await assessmentsService.scheduleAssessment(id, scheduledAt);
      res.json({ message: 'Assessment scheduled successfully.', assessment });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Assessment not found.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      await assessmentsService.deleteAssessment(id);
      res.json({ message: 'Assessment deleted successfully.' });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Assessment not found.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async getQuestions(req, res) {
    const { id } = req.params;

    try {
      const questions = await assessmentsService.getQuestionsForAssessment(id);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async getAvailable(req, res) {
    try {
      const assessments = await assessmentsService.getAvailableAssessments(req.user.id);
      res.json(assessments);
    } catch (error) {
      if (error.code === 'USER_DEPT_NOT_FOUND') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async submit(req, res) {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    try {
      const result = await assessmentsService.submitAssessment(id, answers, userId);
      res.status(201).json({ message: 'Assessment submitted successfully.', result });
    } catch (error) {
      if (error.code === 'ASSESSMENT_NOT_AVAILABLE') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }
}

module.exports = new AssessmentsController();