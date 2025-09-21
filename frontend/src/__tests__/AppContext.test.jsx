import React from 'react';
import { render, act } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('AppContext', () => {
  let apiInstance;

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    mockedAxios.create.mockReturnValue({
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    apiInstance = mockedAxios.create();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('provides context value', () => {
    let contextValue;
    render(
      <AppProvider>
        <TestComponent onValue={(value) => { contextValue = value; }} />
      </AppProvider>
    );

    expect(contextValue).toHaveProperty('login');
    expect(contextValue).toHaveProperty('logout');
    expect(contextValue).toHaveProperty('isAuthenticated');
    expect(contextValue).toHaveProperty('hasRole');
  });

  it('login function works correctly on success', async () => {
    const mockResponse = {
      data: {
        token: 'newToken',
        refreshToken: 'newRefreshToken',
        user: { id: 1, email: 'test@example.com' }
      }
    };
    apiInstance.post.mockResolvedValue(mockResponse);

    let contextValue;
    render(
      <AppProvider>
        <TestComponent onValue={(value) => { contextValue = value; }} />
      </AppProvider>
    );

    let result;
    await act(async () => {
      result = await contextValue.login('test@example.com', 'password');
    });

    expect(result.success).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'newToken');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'newRefreshToken');
  });

  it('login function handles error', async () => {
    const mockError = {
      response: {
        data: { error: 'Invalid credentials' }
      }
    };
    apiInstance.post.mockRejectedValue(mockError);

    let contextValue;
    render(
      <AppProvider>
        <TestComponent onValue={(value) => { contextValue = value; }} />
      </AppProvider>
    );

    let result;
    await act(async () => {
      result = await contextValue.login('test@example.com', 'wrongpassword');
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('logout clears user and tokens', () => {
    let contextValue;
    render(
      <AppProvider>
        <TestComponent onValue={(value) => { contextValue = value; }} />
      </AppProvider>
    );

    act(() => {
      contextValue.logout();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});

// Helper component to access context
const TestComponent = ({ onValue }) => {
  const value = React.useContext(require('../context/AppContext').AppContext);
  React.useEffect(() => {
    onValue(value);
  }, [value, onValue]);
  return null;
};