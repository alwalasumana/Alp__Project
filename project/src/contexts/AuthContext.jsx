import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app load
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, clear it
        logout();
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        return { success: true, message: data.message };
      } else {
        setIsLoading(false);
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return { success: false, message: 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const savePerformance = async (performanceData) => {
    try {
      const response = await fetch('http://localhost:5000/api/performance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(performanceData)
      });

      if (response.ok) {
        const data = await response.json();
        // Update user's total points and level
        if (data.performance) {
          setUser(prevUser => ({
            ...prevUser,
            totalPoints: prevUser.totalPoints + performanceData.score,
            level: Math.floor((prevUser.totalPoints + performanceData.score) / 1000) + 1
          }));
        }
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Performance save error:', error);
      return { success: false, error: 'Failed to save performance' };
    }
  };

  const getPerformance = async (studentId, gameType = null, limit = 10) => {
    try {
      let url = `http://localhost:5000/api/performance/${studentId}?limit=${limit}`;
      if (gameType) {
        url += `&gameType=${gameType}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, performances: data.performances };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Performance fetch error:', error);
      return { success: false, error: 'Failed to fetch performance' };
    }
  };

  const getStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/therapist/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, students: data.students };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Students fetch error:', error);
      return { success: false, error: 'Failed to fetch students' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message, resetToken: data.resetToken };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Failed to process forgot password request' };
    }
  };

  const resetPassword = async (resetToken, newPassword) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resetToken, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    savePerformance,
    getPerformance,
    getStudents,
    forgotPassword,
    resetPassword,
    token,
    refreshProfile: fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};