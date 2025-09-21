const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class AssessmentsService {
  async getAllAssessments() {
    return await prisma.assessment.findMany({
      include: {
        policy: true,
        questions: true,
        results: true
      }
    });
  }

  async createAssessment(title, policyId) {
    return await prisma.assessment.create({
      data: {
        title,
        policyId
      },
      include: {
        policy: true
      }
    });
  }

  async addQuestionToAssessment(assessmentId, text) {
    return await prisma.question.create({
      data: {
        text,
        assessmentId: parseInt(assessmentId)
      }
    });
  }

  async scheduleAssessment(assessmentId, scheduledAt) {
    const assessment = await prisma.assessment.update({
      where: { id: parseInt(assessmentId) },
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

    return assessment;
  }

  async deleteAssessment(assessmentId) {
    return await prisma.assessment.delete({
      where: { id: parseInt(assessmentId) }
    });
  }

  async getQuestionsForAssessment(assessmentId) {
    return await prisma.question.findMany({
      where: { assessmentId: parseInt(assessmentId) }
    });
  }

  async getAvailableAssessments(userId) {
    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    if (!user || !user.departmentId) {
      const error = new Error('User department not found.');
      error.code = 'USER_DEPT_NOT_FOUND';
      throw error;
    }

    // Get assessments for user's department policies that are scheduled and not taken
    return await prisma.assessment.findMany({
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
  }

  async submitAssessment(assessmentId, answers, userId) {
    // Check if assessment is available for user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    const assessment = await prisma.assessment.findFirst({
      where: {
        id: parseInt(assessmentId),
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
      const error = new Error('Assessment not available.');
      error.code = 'ASSESSMENT_NOT_AVAILABLE';
      throw error;
    }

    // Calculate score (simple: correct if answer matches question text or something; for now, assume all correct for demo)
    const totalQuestions = assessment.questions.length;
    const score = (answers.length / totalQuestions) * 100; // Placeholder scoring

    // Create result
    return await prisma.result.create({
      data: {
        userId: userId,
        assessmentId: parseInt(assessmentId),
        score: score
      }
    });
  }
}

module.exports = new AssessmentsService();