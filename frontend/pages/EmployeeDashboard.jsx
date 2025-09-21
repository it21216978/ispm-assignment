import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const EmployeeDashboard = () => {
    const { api, logout, user } = useContext(AppContext);
    const [performanceData, setPerformanceData] = useState(null);
    const [availableAssessments, setAvailableAssessments] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [assessmentAnswers, setAssessmentAnswers] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [performanceResponse, assessmentsResponse, policiesResponse] = await Promise.all([
                api.get('/performance/me'),
                api.get('/assessments/available'),
                api.get('/policies/department')
            ]);
            setPerformanceData(performanceResponse.data);
            setAvailableAssessments(assessmentsResponse.data || []);
            setPolicies(policiesResponse.data || []);
        } catch (error) {
            setError('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleTakeAssessment = (assessment) => {
        setSelectedAssessment(assessment);
        // Initialize answers object
        const answers = {};
        assessment.questions.forEach(q => {
            answers[q.id] = '';
        });
        setAssessmentAnswers(answers);
    };

    const handleAnswerChange = (questionId, answer) => {
        setAssessmentAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmitAssessment = async () => {
        try {
            const answersArray = Object.entries(assessmentAnswers).map(([questionId, answer]) => ({
                questionId: parseInt(questionId),
                answer
            }));

            await api.post(`/assessments/${selectedAssessment.id}/submit`, {
                answers: answersArray
            });

            alert('Assessment submitted successfully!');
            setSelectedAssessment(null);
            setAssessmentAnswers({});
            // Refresh data
            fetchDashboardData();
        } catch (error) {
            setError('Failed to submit assessment');
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
                            <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
                            <p className="text-gray-600">Welcome, {user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">My Performance</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Your assessment results and metrics</p>
                        </div>
                        <div className="border-t border-gray-200">
                            {performanceData?.assessmentResults?.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {performanceData.assessmentResults.map((result) => (
                                        <li key={result.id} className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {result.assessment.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Score: {result.score ? `${result.score}%` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    No assessment results yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Assessments Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Available Assessments</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Assessments you can take</p>
                        </div>
                        <div className="border-t border-gray-200">
                            {availableAssessments.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {availableAssessments.map((assessment) => (
                                        <li key={assessment.id} className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {assessment.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Policy: {assessment.policy.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Questions: {assessment.questions.length}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleTakeAssessment(assessment)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                                >
                                                    Take Assessment
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    No assessments available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Policies Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md lg:col-span-2">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Company Policies</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Important policies you need to acknowledge</p>
                        </div>
                        <div className="border-t border-gray-200">
                            {policies.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {policies.map((policy) => (
                                        <li key={policy.id} className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {policy.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Version: {policy.version} | Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                                        View
                                                    </button>
                                                    <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                                                        Acknowledge
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    No policies available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Assessment Modal */}
            {selectedAssessment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedAssessment.title}</h3>
                            <div className="space-y-4">
                                {selectedAssessment.questions.map((question) => (
                                    <div key={question.id} className="border-b border-gray-200 pb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {question.text}
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="3"
                                            value={assessmentAnswers[question.id] || ''}
                                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            placeholder="Enter your answer..."
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    onClick={() => setSelectedAssessment(null)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitAssessment}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Submit Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;