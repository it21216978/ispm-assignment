import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const AdminDashboard = () => {
    const { api, logout, user } = useContext(AppContext);
    const [stats, setStats] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', departmentId: '' });
    const [departments, setDepartments] = useState([]);
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        fetchDepartmentsAndCompanies();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, employeesResponse] = await Promise.all([
                api.get('/performance/dashboard'),
                api.get('/employees')
            ]);
            setStats(statsResponse.data);
            setEmployees(employeesResponse.data);
        } catch (error) {
            setError('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentsAndCompanies = async () => {
        try {
            // Assuming these endpoints exist or we can derive from employees data
            // For now, we'll extract unique departments and companies from employees
            const uniqueDepartments = [];
            const uniqueCompanies = [];
            employees.forEach(emp => {
                if (emp.department && !uniqueDepartments.find(d => d.id === emp.department.id)) {
                    uniqueDepartments.push(emp.department);
                }
                if (emp.company && !uniqueCompanies.find(c => c.id === emp.company.id)) {
                    uniqueCompanies.push(emp.company);
                }
            });
            setDepartments(uniqueDepartments);
            setCompanies(uniqueCompanies);
        } catch (error) {
            console.error('Failed to fetch departments and companies', error);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleInviteEmployee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/invite', {
                email: inviteForm.email,
                departmentId: inviteForm.departmentId,
                companyId: companies[0]?.id // Assuming single company for now
            });
            setShowInviteModal(false);
            setInviteForm({ email: '', departmentId: '' });
            alert('Invitation sent successfully!');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to send invitation');
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/employees/${employeeId}`);
                setEmployees(employees.filter(emp => emp.id !== employeeId));
            } catch (error) {
                setError('Failed to delete employee');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
                            <p className="text-gray-600">Welcome, {user?.email}</p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Invite Employee
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">E</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.totalEmployees || employees.length}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">A</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Active Assessments</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.activeAssessments || 0}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">C</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Compliance Rate</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.complianceRate || 0}%</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white font-bold">P</span>
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Policies</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.pendingPolicies || 0}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Employees Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Employees</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your company employees</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {employees.map((employee) => (
                            <li key={employee.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-700 font-medium">
                                                        {employee.email.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{employee.email}</div>
                                                <div className="text-sm text-gray-500">
                                                    {employee.company?.name} - {employee.department?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEmployee(employee.id)}
                                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Employee</h3>
                            <form onSubmit={handleInviteEmployee}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <select
                                        required
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        value={inviteForm.departmentId}
                                        onChange={(e) => setInviteForm({...inviteForm, departmentId: e.target.value})}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Send Invitation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;