const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class PoliciesService {
  async getAllPolicies() {
    return await prisma.policy.findMany({
      include: {
        department: true
      }
    });
  }

  async createPolicy(title, content, departmentId, file) {
    const policyData = {
      title,
      content,
      departmentId: parseInt(departmentId)
    };

    if (file) {
      policyData.filePath = file.path;
      policyData.fileName = file.originalname;
      policyData.fileSize = file.size;
      policyData.mimeType = file.mimetype;
    }

    return await prisma.policy.create({
      data: policyData,
      include: {
        department: true
      }
    });
  }

  async deletePolicy(id) {
    return await prisma.policy.delete({
      where: { id: parseInt(id) }
    });
  }

  async getDepartmentPolicies(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true }
    });

    if (!user || !user.departmentId) {
      throw new Error('User department not found.');
    }

    return await prisma.policy.findMany({
      where: {
        departmentId: user.departmentId
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    });
  }
}

module.exports = new PoliciesService();