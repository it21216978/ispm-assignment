const AnalyticsService = require('../services/analyticsService');

// Mock Prisma
jest.mock('../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    result: {
      groupBy: jest.fn(),
      aggregate: jest.fn()
    },
    performanceData: {
      count: jest.fn()
    },
    user: {
      count: jest.fn()
    },
    department: {
      findMany: jest.fn()
    }
  }))
}));

const { PrismaClient } = require('../generated/prisma');

describe('Analytics Service', () => {
  let analyticsService;
  let mockPrisma;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePerformanceScores', () => {
    it('should return cached data if available', async () => {
      const cachedData = [{ userId: 1, averageScore: 85 }];
      analyticsService.setCached('performanceScores', cachedData);

      const result = await analyticsService.calculatePerformanceScores();

      expect(result).toEqual(cachedData);
      expect(mockPrisma.result.groupBy).not.toHaveBeenCalled();
    });

    it('should calculate and cache performance scores', async () => {
      const mockResults = [
        { userId: 1, _avg: { score: 85 }, _count: { score: 5 } },
        { userId: 2, _avg: { score: 90 }, _count: { score: 3 } }
      ];
      mockPrisma.result.groupBy.mockResolvedValue(mockResults);

      const result = await analyticsService.calculatePerformanceScores();

      expect(mockPrisma.result.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        _avg: { score: true },
        _count: { score: true }
      });
      expect(result).toEqual([
        { userId: 1, averageScore: 85, totalAssessments: 5 },
        { userId: 2, averageScore: 90, totalAssessments: 3 }
      ]);
    });
  });

  describe('calculateCompliancePercentages', () => {
    it('should calculate compliance percentage', async () => {
      mockPrisma.performanceData.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80); // compliant

      const result = await analyticsService.calculateCompliancePercentages();

      expect(result).toEqual({
        totalRecords: 100,
        compliantRecords: 80,
        compliancePercentage: 80
      });
    });

    it('should return 0% if no records', async () => {
      mockPrisma.performanceData.count.mockResolvedValue(0);

      const result = await analyticsService.calculateCompliancePercentages();

      expect(result.compliancePercentage).toBe(0);
    });
  });

  describe('generateDashboardStatistics', () => {
    it('should generate dashboard statistics', async () => {
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.result.aggregate.mockResolvedValue({ _avg: { score: 87.5 } });
      mockPrisma.performanceData.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(160);
      mockPrisma.department.findMany.mockResolvedValue([
        { id: 1, name: 'IT', _count: { users: 20 } },
        { id: 2, name: 'HR', _count: { users: 15 } }
      ]);

      const result = await analyticsService.generateDashboardStatistics();

      expect(result).toEqual({
        totalEmployees: 50,
        averageScore: 87.5,
        compliancePercentage: 80,
        departments: [
          { id: 1, name: 'IT', employeeCount: 20 },
          { id: 2, name: 'HR', employeeCount: 15 }
        ]
      });
    });
  });

  describe('Cache methods', () => {
    it('should get and set cached data', () => {
      const key = 'testKey';
      const data = { test: 'data' };

      analyticsService.setCached(key, data);
      const retrieved = analyticsService.getCached(key);

      expect(retrieved).toEqual(data);
    });

    it('should return null for expired cache', () => {
      const key = 'testKey';
      const data = { test: 'data' };

      analyticsService.setCached(key, data);
      // Mock time to be past TTL
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000); // 6 minutes later

      const retrieved = analyticsService.getCached(key);

      expect(retrieved).toBeNull();
    });

    it('should clear cache', () => {
      analyticsService.setCached('key1', 'data1');
      analyticsService.setCached('key2', 'data2');

      analyticsService.clearCache();

      expect(analyticsService.getCached('key1')).toBeNull();
      expect(analyticsService.getCached('key2')).toBeNull();
    });
  });
});