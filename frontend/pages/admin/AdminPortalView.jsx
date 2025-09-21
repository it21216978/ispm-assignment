import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Button } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import PolicyIcon from '@mui/icons-material/Policy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrainingIcon from '@mui/icons-material/School';

const AdminPortalView = () => {
    const functionalities = [
        {
            title: 'Employees',
            description: 'Manage company employees, view profiles, and handle invitations.',
            icon: <PeopleIcon fontSize="large" color="primary" />,
            action: 'Manage Employees'
        },
        {
            title: 'Departments',
            description: 'Organize and manage company departments and teams.',
            icon: <BusinessIcon fontSize="large" color="secondary" />,
            action: 'View Departments'
        },
        {
            title: 'Policies',
            description: 'Create, update, and monitor company policies and compliance.',
            icon: <PolicyIcon fontSize="large" color="success" />,
            action: 'Manage Policies'
        },
        {
            title: 'Assessments',
            description: 'Design and assign performance assessments to employees.',
            icon: <AssessmentIcon fontSize="large" color="warning" />,
            action: 'Create Assessments'
        },
        {
            title: 'Analytics',
            description: 'View detailed analytics and reports on employee performance.',
            icon: <AnalyticsIcon fontSize="large" color="info" />,
            action: 'View Analytics'
        },
        {
            title: 'Training',
            description: 'Manage training programs and track employee progress.',
            icon: <TrainingIcon fontSize="large" color="error" />,
            action: 'Manage Training'
        }
    ];

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Admin Portal
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                Access and manage all administrative functions from here.
            </Typography>

            <Grid container spacing={3}>
                {functionalities.map((func, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                <Box sx={{ mb: 2 }}>
                                    {func.icon}
                                </Box>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {func.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    {func.description}
                                </Typography>
                                <Button variant="contained" color="primary">
                                    {func.action}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default AdminPortalView;