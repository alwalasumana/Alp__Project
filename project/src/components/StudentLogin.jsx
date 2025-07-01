import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, GraduationCap, Eye, EyeOff, UserPlus, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './StudentLogin.css';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.user && data.token) {
        login(data.user, data.token);
        navigate('/dashboard/student');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="student-login-bg">
      <div className="student-login-card">
        <div className="student-login-header">
          <div className="student-login-icon">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="student-login-title">Student Login</h1>
        </div>
        <form onSubmit={handleSubmit} className="student-login-form">
          <div className="student-login-input-wrap">
            <Mail className="student-login-icon-left w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="student-login-input"
              placeholder="Email"
              required
            />
          </div>
          <div className="student-login-input-wrap">
            <Lock className="student-login-icon-left w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="student-login-input"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="student-login-icon-right"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && (
            <div className="student-login-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="student-login-btn"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="student-login-footer">
          <div className="student-login-links">
            <button
              onClick={() => navigate('/forgot-password/student')}
              className="student-login-link-small"
              type="button"
            >
              <HelpCircle className="w-4 h-4" />
              Forgot Password?
            </button>
          </div>
          <p className="student-login-text">Don't have an account?</p>
          <button
            onClick={() => navigate('/register/student')}
            className="student-login-link"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            Sign Up as Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
