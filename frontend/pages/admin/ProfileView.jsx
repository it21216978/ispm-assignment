import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Grid,
    Paper,
    Alert
} from '@mui/material';
import { AppContext } from '../../context/AppContext';

const ProfileView = () => {
    const { user, api } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department?.name || '',
                role: user.role || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Assuming there's an endpoint to update profile
            await api.put('/admin/profile', formData);
            setSuccess('Profile updated successfully!');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Profile Settings
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                Manage your account information and preferences.
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 600 }}>
                <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
                    <Avatar
                        sx={{ width: 80, height: 80, mr: 3 }}
                        src={user?.avatar} // Assuming avatar URL if available
                    >
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">{user?.name || 'Admin User'}</Typography>
                        <Typography color="textSecondary">{user?.email}</Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                disabled // Assuming department is not editable by user
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled // Role probably not editable
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Profile'}
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => {
                                // Reset to original values
                                if (user) {
                                    setFormData({
                                        name: user.name || '',
                                        email: user.email || '',
                                        phone: user.phone || '',
                                        department: user.department?.name || '',
                                        role: user.role || ''
                                    });
                                }
                            }}
                        >
                            Reset
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default ProfileView;