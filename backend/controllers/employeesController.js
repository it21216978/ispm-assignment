const employeesService = require('../services/employeesService');

class EmployeesController {
  async getAll(req, res) {
    try {
      const employees = await employeesService.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: 'Server error.' });
    }
  }

  async create(req, res) {
    const { email, password, companyId, departmentId } = req.body;

    try {
      const employee = await employeesService.createEmployee(email, password, companyId, departmentId);
      res.status(201).json({ message: 'Employee created successfully.', employee });
    } catch (error) {
      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Email already exists.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async getById(req, res) {
    const { id } = req.params;

    try {
      const employee = await employeesService.getEmployeeById(id);
      res.json(employee);
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { email, companyId, departmentId } = req.body;

    try {
      const employee = await employeesService.updateEmployee(id, email, companyId, departmentId);
      res.json({ message: 'Employee updated successfully.', employee });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Employee not found.' });
      } else if (error.code === 'P2002') {
        res.status(400).json({ error: 'Email already exists.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      await employeesService.deleteEmployee(id);
      res.json({ message: 'Employee deleted successfully.' });
    } catch (error) {
      if (error.code === 'P2025') {
        res.status(404).json({ error: 'Employee not found.' });
      } else {
        res.status(500).json({ error: 'Server error.' });
      }
    }
  }
}

module.exports = new EmployeesController();