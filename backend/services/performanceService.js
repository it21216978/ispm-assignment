const { PrismaClient } = require('../generated/prisma');
const analyticsService = require('./analyticsService');

const prisma = new PrismaClient();

class PerformanceService {
  async getAllScores() {
    return await prisma.result.findMany({
      include: {
        user: {
          select: { id: true, email: true, department: true }
        },
        assessment: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async getComplianceData() {
    return await prisma.performanceData.findMany({
      where: { compliance: true },
      include: {
        user: {
          select: { id: true, email: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async getNonComplianceData() {
    return await prisma.performanceData.findMany({
      where: { compliance: false },
      include: {
        user: {
          select: { id: true, email: true }
        },
        department: {
          select: { id: true, name: true }
        }
      }
    });
  }

  async getPersonalPerformance(userId) {
    // Get assessment results
    const results = await prisma.result.findMany({
      where: { userId: userId },
      include: {
        assessment: {
          select: { id: true, title: true }
        }
      }
    });

    // Get performance data
    const performanceData = await prisma.performanceData.findMany({
      where: { userId: userId },
      select: {
        id: true,
        metric: true,
        value: true,
        compliance: true,
        date: true
      },
      orderBy: { date: 'desc' }
    });

    return {
      assessmentResults: results,
      performanceMetrics: performanceData
    };
  }

  async getScoreAnalytics() {
    return await analyticsService.calculatePerformanceScores();
  }

  async getComplianceAnalytics() {
    return await analyticsService.calculateCompliancePercentages();
  }

  async getDashboardStats() {
    return await analyticsService.generateDashboardStatistics();
  }
}

module.exports = new PerformanceService();