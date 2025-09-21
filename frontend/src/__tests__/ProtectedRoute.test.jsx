import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock AppContext
const mockAppContext = {
  isAuthenticated: jest.fn(),
  hasRole: jest.fn(),
  loading: false,
  user: { role: 'Employee' }
};

jest.mock('../context/AppContext', () => ({
  AppContext: {
    Consumer: ({ children }) => children(mockAppContext)
  }
}));

// Mock Navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }) => {
    mockNavigate(to);
    return <div>Redirecting to {to}</div>;
  }
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when loading', () => {
    mockAppContext.loading = true;
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Redirecting to /login')).toBeInTheDocument(); // Since not authenticated
  });

  it('redirects to login if not authenticated', () => {
    mockAppContext.loading = false;
    mockAppContext.isAuthenticated.mockReturnValue(false);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('redirects based on role if not allowed', () => {
    mockAppContext.loading = false;
    mockAppContext.isAuthenticated.mockReturnValue(true);
    mockAppContext.hasRole.mockReturnValue(false);
    mockAppContext.user.role = 'Employee';

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['Admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/employee/dashboard');
  });

  it('renders children if authenticated and role allowed', () => {
    mockAppContext.loading = false;
    mockAppContext.isAuthenticated.mockReturnValue(true);
    mockAppContext.hasRole.mockReturnValue(true);

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['Admin']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders children if no role restrictions', () => {
    mockAppContext.loading = false;
    mockAppContext.isAuthenticated.mockReturnValue(true);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Public Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});