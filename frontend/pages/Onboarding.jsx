import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        token: '',
        companyName: '',
        departments: ['']
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { onboard, api } = useContext(AppContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            setFormData(prev => ({ ...prev, token }));
        }
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDepartmentChange = (index, value) => {
        const newDepartments = [...formData.departments];
        newDepartments[index] = value;
        setFormData(prev => ({ ...prev, departments: newDepartments }));
    };

    const addDepartment = () => {
        setFormData(prev => ({ ...prev, departments: [...prev.departments, ''] }));
    };

    const removeDepartment = (index) => {
        if (formData.departments.length > 1) {
            const newDepartments = formData.departments.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, departments: newDepartments }));
        }
    };

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');

        const result = await onboard({
            email: formData.email,
            password: formData.password,
            token: formData.token
        });
        setLoading(false);

        if (result.success) {
            if (result.redirect === 'onboarding-wizard') {
                setStep(2);
            } else {
                navigate('/employee/dashboard');
            }
        } else {
            setError(result.error);
        }
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/wizard/company', { name: formData.companyName });
            setStep(3);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create company');
        } finally {
            setLoading(false);
        }
    };

    const handleStep3Submit = async (e) => {
        e.preventDefault();
        const validDepartments = formData.departments.filter(dept => dept.trim());
        if (validDepartments.length === 0) {
            setError('At least one department is required');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/wizard/departments', { departments: validDepartments });
            setStep(4);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create departments');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/wizard/complete');
            navigate('/admin/dashboard');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 1 ? 'Welcome' : step === 2 ? 'Create Company' : step === 3 ? 'Add Departments' : 'Setup Complete'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 && 'Please set up your account'}
                        {step === 2 && 'Enter your company information'}
                        {step === 3 && 'Add departments for your company'}
                        {step === 4 && 'Your setup is complete!'}
                    </p>
                </div>

                {step === 1 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep1Submit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Setting up...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep2Submit}>
                        <div>
                            <input
                                name="companyName"
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Company Name"
                                value={formData.companyName}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Company'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep3Submit}>
                        <div className="space-y-2">
                            {formData.departments.map((dept, index) => (
                                <div key={index} className="flex space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder={`Department ${index + 1}`}
                                        value={dept}
                                        onChange={(e) => handleDepartmentChange(index, e.target.value)}
                                    />
                                    {formData.departments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDepartment(index)}
                                            className="px-3 py-2 text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addDepartment}
                                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Add Department
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Departments'}
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="mt-8 space-y-6">
                        <div className="text-center">
                            <p className="text-green-600 font-medium">Setup completed successfully!</p>
                        </div>
                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Completing...' : 'Go to Dashboard'}
                        </button>
                    </div>
                )}

                {error && (
                    <div className="text-red-600 text-sm text-center mt-4">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;