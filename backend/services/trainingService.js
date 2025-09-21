const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class TrainingService {
  async getAllTrainingContents() {
    return await prisma.trainingContent.findMany({
      include: {
        policy: true
      }
    });
  }

  async createTrainingContent(title, content, policyId) {
    const trainingData = {
      title,
      content,
      policyId: parseInt(policyId)
    };

    return await prisma.trainingContent.create({
      data: trainingData,
      include: {
        policy: true
      }
    });
  }

  async deleteTrainingContent(id) {
    return await prisma.trainingContent.delete({
      where: { id: parseInt(id) }
    });
  }

  async getTrainingContentsForPolicy(policyId, userId) {
    // Check if user has access to this policy (same department)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    const policy = await prisma.policy.findFirst({
      where: {
        id: parseInt(policyId),
        departmentId: user.departmentId
      }
    });

    if (!policy) {
      const error = new Error('Access denied.');
      error.code = 'ACCESS_DENIED';
      throw error;
    }

    return await prisma.trainingContent.findMany({
      where: { policyId: parseInt(policyId) },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    });
  }
}

module.exports = new TrainingService();