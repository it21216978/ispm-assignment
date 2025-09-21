import React, { useState, useContext } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    IconButton,
    CssBaseline
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import DashboardView from './admin/DashboardView';
import AdminPortalView from './admin/AdminPortalView';
import ProfileView from './admin/ProfileView';

const AdminDashboard = () => {
    const { logout, user } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const drawerWidth = 240;

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Admin Portal', icon: <AdminIcon />, path: '/admin/portal' },
        { text: 'Profile', icon: <PersonIcon />, path: '/admin/profile' }
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Admin Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                >
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={handleLogout}>
                                <ListItemIcon>
                                    <LogoutIcon />
                                </ListItemIcon>
                                <ListItemText primary="Logout" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar />
                <Routes>
                    <Route path="dashboard" element={<DashboardView />} />
                    <Route path="portal" element={<AdminPortalView />} />
                    <Route path="profile" element={<ProfileView />} />
                    <Route path="/" element={<DashboardView />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminDashboard;