import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, hasRole, loading } = useContext(AppContext);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        // Redirect to appropriate dashboard based on role
        const userRole = useContext(AppContext).user?.role;
        if (userRole === 'SuperAdmin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            return <Navigate to="/employee/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;