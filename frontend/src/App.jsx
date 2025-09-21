import { Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Onboarding from '../pages/Onboarding'
import Home from '../pages/Home'
import About from '../pages/About'
// Import dashboard components (will create them next)
import AdminDashboard from '../pages/AdminDashboard'
import EmployeeDashboard from '../pages/EmployeeDashboard'

function App() {
  const { isAuthenticated, user } = useContext(AppContext)

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/about" element={<About />} />

      {/* Protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['SuperAdmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          isAuthenticated() ? (
            user?.role === 'SuperAdmin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/employee/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
