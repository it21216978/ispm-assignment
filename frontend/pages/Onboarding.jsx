import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';

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

    const steps = ['Profile Setup', 'Company Details', 'Departments'];

    return (
        <Container component="main" maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        {step === 4 ? 'Setup Complete' : steps[step - 1]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {step === 1 && 'Upload your profile image (optional)'}
                        {step === 2 && 'Enter your company information'}
                        {step === 3 && 'Add departments for your company'}
                        {step === 4 && 'Your setup is complete!'}
                    </Typography>
                </Box>
                <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {step === 1 && (
                    <Box component="form" onSubmit={handleStep1Submit} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                            <Box
                                sx={{
                                    width: 96,
                                    height: 96,
                                    bgcolor: 'grey.200',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 2
                                }}
                            >
                                {formData.profileImage ? (
                                    <Typography variant="body2" color="text.secondary">Image</Typography>
                                ) : (
                                    <Typography variant="h4" color="text.disabled">👤</Typography>
                                )}
                            </Box>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profileImage"
                                type="file"
                                onChange={handleImageChange}
                            />
                            <label htmlFor="profileImage">
                                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                                    {formData.profileImage ? 'Change Image' : 'Upload Image'}
                                </Button>
                            </label>
                            {formData.profileImage && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {formData.profileImage}
                                </Typography>
                            )}
                        </Box>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Continue'}
                        </Button>
                    </Box>
                )}

                {step === 2 && (
                    <Box component="form" onSubmit={handleStep2Submit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="companyName"
                            label="Company Name"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="industry-label">Industry</InputLabel>
                            <Select
                                labelId="industry-label"
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleInputChange}
                                label="Industry"
                            >
                                <MenuItem value="">
                                    <em>Select Industry</em>
                                </MenuItem>
                                {industries.map(ind => (
                                    <MenuItem key={ind} value={ind}>{ind}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            margin="normal"
                            fullWidth
                            id="address"
                            label="Address"
                            name="address"
                            multiline
                            rows={3}
                            value={formData.address}
                            onChange={handleInputChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="employeeCount"
                            label="Employee Count"
                            name="employeeCount"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={formData.employeeCount}
                            onChange={handleInputChange}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Continue'}
                        </Button>
                    </Box>
                )}

                {step === 3 && (
                    <Box component="form" onSubmit={handleStep3Submit} sx={{ mt: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Departments *
                        </Typography>
                        {formData.departments.map((dept, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField
                                    fullWidth
                                    placeholder={`Department ${index + 1}`}
                                    value={dept}
                                    onChange={(e) => handleDepartmentChange(index, e.target.value)}
                                    sx={{ mr: 1 }}
                                />
                                {formData.departments.length > 1 && (
                                    <IconButton
                                        onClick={() => removeDepartment(index)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            onClick={addDepartment}
                            sx={{ mb: 2 }}
                        >
                            Add Department
                        </Button>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Continue'}
                        </Button>
                    </Box>
                )}

                {step === 4 && (
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Setup completed successfully!
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleComplete}
                            disabled={loading}
                        >
                            {loading ? 'Completing...' : 'Go to Dashboard'}
                        </Button>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Paper>
        </Container>
    );
};

export default Onboarding;