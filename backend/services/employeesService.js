const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

class EmployeesService {
  async getAllEmployees() {
    return await prisma.user.findMany({
      where: { role: 'Employee' },
      include: {
        company: true,
        department: true
      }
    });
  }

  async createEmployee(email, password, companyId, departmentId) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'Employee',
        companyId,
        departmentId
      },
      include: {
        company: true,
        department: true
      }
    });
  }

  async getEmployeeById(id) {
    const employee = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        company: true,
        department: true
      }
    });

    if (!employee || employee.role !== 'Employee') {
      const error = new Error('Employee not found.');
      error.code = 'NOT_FOUND';
      throw error;
    }

    return employee;
  }

  async updateEmployee(id, email, companyId, departmentId) {
    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email,
        companyId,
        departmentId
      },
      include: {
        company: true,
        department: true
      }
    });
  }

  async deleteEmployee(id) {
    return await prisma.user.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = new EmployeesService();