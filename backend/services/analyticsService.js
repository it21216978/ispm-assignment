const { PrismaClient } = require('../generated/prisma');

class AnalyticsService {
  constructor() {
    this.prisma = new PrismaClient();
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Simple cache get/set
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCached(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async calculatePerformanceScores() {
    const cacheKey = 'performanceScores';
    let scores = this.getCached(cacheKey);
    if (scores) return scores;

    // Calculate average scores per user
    const results = await this.prisma.result.groupBy({
      by: ['userId'],
      _avg: {
        score: true
      },
      _count: {
        score: true
      }
    });

    scores = results.map(r => ({
      userId: r.userId,
      averageScore: r._avg.score,
      totalAssessments: r._count.score
    }));

    this.setCached(cacheKey, scores);
    return scores;
  }

  async calculateCompliancePercentages() {
    const cacheKey = 'compliancePercentages';
    let compliance = this.getCached(cacheKey);
    if (compliance) return compliance;

    // Compliance based on PerformanceData
    const totalData = await this.prisma.performanceData.count();
    const compliantData = await this.prisma.performanceData.count({
      where: { compliance: true }
    });

    const percentage = totalData > 0 ? (compliantData / totalData) * 100 : 0;

    compliance = {
      totalRecords: totalData,
      compliantRecords: compliantData,
      compliancePercentage: percentage
    };

    this.setCached(cacheKey, compliance);
    return compliance;
  }

  async generateDashboardStatistics() {
    const cacheKey = 'dashboardStats';
    let stats = this.getCached(cacheKey);
    if (stats) return stats;

    // Total employees
    const totalEmployees = await this.prisma.user.count({
      where: { role: 'Employee' }
    });

    // Average performance score
    const avgScoreResult = await this.prisma.result.aggregate({
      _avg: {
        score: true
      }
    });
    const averageScore = avgScoreResult._avg.score || 0;

    // Compliance percentage
    const compliance = await this.calculateCompliancePercentages();

    // Department stats
    const departmentStats = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    stats = {
      totalEmployees,
      averageScore,
      compliancePercentage: compliance.compliancePercentage,
      departments: departmentStats.map(d => ({
        id: d.id,
        name: d.name,
        employeeCount: d._count.users
      }))
    };

    this.setCached(cacheKey, stats);
    return stats;
  }

  // Method to clear cache if needed
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new AnalyticsService();