const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class AdminController {
  async getDashboard(req, res) {
    try {
      // Placeholder stats for SuperAdmin
      const totalUsers = await prisma.user.count();
      const totalCompanies = await prisma.company.count();
      const totalDepartments = await prisma.department.count();
      const totalPolicies = await prisma.policy.count();

      const stats = {
        totalUsers,
        totalCompanies,
        totalDepartments,
        totalPolicies,
        complianceRate: 85.5, // Placeholder
        activeAssessments: 12, // Placeholder
        recentActivities: [
          { action: 'User registered', timestamp: new Date() },
          { action: 'Policy updated', timestamp: new Date() }
        ]
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }
}

module.exports = new AdminController();