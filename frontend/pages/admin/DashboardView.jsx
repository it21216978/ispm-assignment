import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PolicyIcon from '@mui/icons-material/Policy';

const DashboardView = () => {
    const { api } = useContext(AppContext);
    const [stats, setStats] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard Overview
            </Typography>

            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <PeopleIcon color="primary" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Employees
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {stats.totalEmployees || employees.length}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <AssessmentIcon color="success" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Active Assessments
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {stats.activeAssessments || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <CheckCircleIcon color="warning" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Compliance Rate
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {stats.complianceRate || 0}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center">
                                    <PolicyIcon color="secondary" sx={{ mr: 2 }} />
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Pending Policies
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {stats.pendingPolicies || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Additional dashboard content can be added here */}
        </Box>
    );
};

export default DashboardView;