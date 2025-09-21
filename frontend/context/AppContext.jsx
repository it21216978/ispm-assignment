import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // Create axios instance with base URL
    const api = axios.create({
        baseURL: 'http://localhost:5000', // Adjust if backend port differs
    });

    // Add token to requests
    api.interceptors.request.use(
        (config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Handle token refresh on 401
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401 && token) {
                // Token expired, try refresh
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    try {
                        const refreshResponse = await axios.post('http://localhost:3000/auth/refresh', {
                            refreshToken
                        });
                        const newToken = refreshResponse.data.token;
                        const newRefreshToken = refreshResponse.data.refreshToken;
                        setToken(newToken);
                        localStorage.setItem('token', newToken);
                        localStorage.setItem('refreshToken', newRefreshToken);
                        // Retry original request
                        error.config.headers.Authorization = `Bearer ${newToken}`;
                        return api.request(error.config);
                    } catch (refreshError) {
                        logout();
                    }
                } else {
                    logout();
                }
            }
            return Promise.reject(error);
        }
    );

    // Login function
    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;
            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    };

    // Register function
    const register = (data) => {
        const { token, refreshToken, user } = data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
    };

    // Onboard function (for first-time setup or invitation)
    const onboard = async (data) => {
        try {
            const response = await api.post('/auth/onboard', data);
            const { token: newToken, refreshToken: newRefreshToken, user: userData, redirect } = response.data;
            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            return { success: true, redirect };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Onboarding failed' };
        }
    };

    // Check if user is authenticated
    const isAuthenticated = () => !!user && !!token;

    // Check user role
    const hasRole = (roles) => user && roles.includes(user.role);

    // Initialize on app start
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    // You might want to validate token or fetch user data here
                    // For now, assume token is valid if present
                    setToken(storedToken);
                    // Note: In a real app, you'd decode JWT or call /me endpoint
                } catch (error) {
                    logout();
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        register,
        onboard,
        isAuthenticated,
        hasRole,
        api
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};