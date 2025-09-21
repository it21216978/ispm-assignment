import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        profileImage: null,
        companyName: '',
        industry: '',
        address: '',
        employeeCount: '',
        departments: ['']
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { api } = useContext(AppContext);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // For demo purposes, we'll just store the file name
            // In a real app, you'd upload to a server
            setFormData(prev => ({ ...prev, profileImage: file.name }));
        }
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
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/wizard/profile', { profileImage: formData.profileImage });
            setStep(2);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        if (!formData.companyName.trim()) {
            setError('Company name is required');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/wizard/company', {
                name: formData.companyName,
                industry: formData.industry,
                address: formData.address,
                employeeCount: parseInt(formData.employeeCount) || null
            });
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

    const industries = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
        'Retail', 'Consulting', 'Real Estate', 'Transportation', 'Other'
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 1 ? 'Profile Setup' : step === 2 ? 'Company Details' : step === 3 ? 'Departments' : 'Setup Complete'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 && 'Upload your profile image (optional)'}
                        {step === 2 && 'Enter your company information'}
                        {step === 3 && 'Add departments for your company'}
                        {step === 4 && 'Your setup is complete!'}
                    </p>
                    <div className="mt-4 flex justify-center space-x-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-3 h-3 rounded-full ${s <= step ? 'bg-indigo-600' : 'bg-gray-300'}`}
                            />
                        ))}
                    </div>
                </div>

                {step === 1 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep1Submit}>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                {formData.profileImage ? (
                                    <span className="text-gray-600 text-sm">Image</span>
                                ) : (
                                    <span className="text-gray-400 text-2xl">👤</span>
                                )}
                            </div>
                            <div>
                                <label htmlFor="profileImage" className="cursor-pointer">
                                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                                        {formData.profileImage ? 'Change Image' : 'Upload Image'}
                                    </span>
                                    <input
                                        id="profileImage"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {formData.profileImage && (
                                <p className="text-sm text-gray-600">{formData.profileImage}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep2Submit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                                    Company Name *
                                </label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                                    Industry
                                </label>
                                <select
                                    id="industry"
                                    name="industry"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Industry</option>
                                    {industries.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <textarea
                                    id="address"
                                    name="address"
                                    rows={3}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700">
                                    Employee Count
                                </label>
                                <input
                                    id="employeeCount"
                                    name="employeeCount"
                                    type="number"
                                    min="1"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.employeeCount}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Continue'}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form className="mt-8 space-y-6" onSubmit={handleStep3Submit}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Departments *
                            </label>
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
                                            className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
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
                            {loading ? 'Creating...' : 'Continue'}
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