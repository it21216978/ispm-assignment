const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const { verifyToken, requireRole } = require('../auth');
const { sendAssessmentReminder } = require('../services/notificationService');

const router = express.Router();
const prisma = new PrismaClient();

// GET /assessments - List all assessments (SuperAdmin only)
router.get('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        policy: true,
        questions: true,
        results: true
      }
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /assessments - Create new assessment (SuperAdmin only)
router.post('/', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { title, policyId } = req.body;

  try {
    const assessment = await prisma.assessment.create({
      data: {
        title,
        policyId
      },
      include: {
        policy: true
      }
    });

    res.status(201).json({ message: 'Assessment created successfully.', assessment });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /assessments/:id/questions - Add question to assessment (SuperAdmin only)
router.post('/:id/questions', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  try {
    const question = await prisma.question.create({
      data: {
        text,
        assessmentId: parseInt(id)
      }
    });

    res.status(201).json({ message: 'Question added successfully.', question });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /assessments/:id/schedule - Schedule the assessment (SuperAdmin only)
router.put('/:id/schedule', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  const { scheduledAt } = req.body;

  try {
    const assessment = await prisma.assessment.update({
      where: { id: parseInt(id) },
      data: {
        scheduledAt: new Date(scheduledAt)
      },
      include: {
        policy: {
          include: {
            department: true
          }
        }
      }
    });

    // Send assessment reminders to all employees in the department
    const departmentUsers = await prisma.user.findMany({
      where: {
        departmentId: assessment.policy.departmentId,
        role: 'Employee'
      },
      select: { email: true }
    });

    // Send emails asynchronously
    departmentUsers.forEach(user => {
      sendAssessmentReminder(user.email, assessment.title, assessment.scheduledAt);
    });

    res.json({ message: 'Assessment scheduled successfully.', assessment });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Assessment not found.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// DELETE /assessments/:id - Delete assessment (SuperAdmin only)
router.delete('/:id', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.assessment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Assessment deleted successfully.' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Assessment not found.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// GET /assessments/:id/questions - List questions for an assessment (SuperAdmin only)
router.get('/:id/questions', verifyToken, requireRole(['SuperAdmin']), async (req, res) => {
  const { id } = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: { assessmentId: parseInt(id) }
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /assessments/available - List available assessments for employee (Employee only)
router.get('/available', verifyToken, requireRole(['Employee']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    if (!user || !user.departmentId) {
      return res.status(400).json({ error: 'User department not found.' });
    }

    // Get assessments for user's department policies that are scheduled and not taken
    const assessments = await prisma.assessment.findMany({
      where: {
        policy: {
          departmentId: user.departmentId
        },
        scheduledAt: {
          lte: new Date()
        },
        results: {
          none: {
            userId: userId
          }
        }
      },
      include: {
        policy: {
          select: { title: true }
        },
        questions: {
          select: { id: true, text: true }
        }
      }
    });

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /assessments/:id/submit - Submit assessment answers (Employee only)
router.post('/:id/submit', verifyToken, requireRole(['Employee']), async (req, res) => {
  const { id } = req.params;
  const { answers } = req.body; // answers: [{ questionId: 1, answer: 'text' }]
  const userId = req.user.id;

  try {
    // Check if assessment is available for user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: parseInt(id),
        policy: {
          departmentId: user.departmentId
        },
        scheduledAt: {
          lte: new Date()
        },
        results: {
          none: {
            userId: userId
          }
        }
      },
      include: {
        questions: true
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not available.' });
    }

    // Calculate score (simple: correct if answer matches question text or something; for now, assume all correct for demo)
    const totalQuestions = assessment.questions.length;
    const score = (answers.length / totalQuestions) * 100; // Placeholder scoring

    // Create result
    const result = await prisma.result.create({
      data: {
        userId: userId,
        assessmentId: parseInt(id),
        score: score
      }
    });

    res.status(201).json({ message: 'Assessment submitted successfully.', result });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;