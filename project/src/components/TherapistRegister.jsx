import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Users, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TherapistLogin.css';

const TherapistRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: 'therapist'
    };

    const result = await register(userData);
    
    if (result.success) {
      setSuccess('Registration successful! You can now login.');
      setTimeout(() => {
        navigate('/login/therapist');
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="therapist-login-bg">
      <div className="therapist-login-card">
        <div className="therapist-login-header">
          <div className="therapist-login-icon">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="therapist-login-title">Therapist Registration</h1>
        </div>
        <form onSubmit={handleSubmit} className="therapist-login-form">
          <div className="therapist-login-input-wrap">
            <User className="therapist-login-icon-left w-5 h-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="therapist-login-input"
              placeholder="Full Name"
              required
            />
          </div>
          <div className="therapist-login-input-wrap">
            <Mail className="therapist-login-icon-left w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="therapist-login-input"
              placeholder="Email Address"
              required
            />
          </div>
          <div className="therapist-login-input-wrap">
            <Lock className="therapist-login-icon-left w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="therapist-login-input"
              placeholder="Password (min 6 characters)"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="therapist-login-icon-right"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="therapist-login-input-wrap">
            <Lock className="therapist-login-icon-left w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="therapist-login-input"
              placeholder="Confirm Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="therapist-login-icon-right"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && (
            <div className="therapist-login-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="therapist-login-success">
              <span>{success}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="therapist-login-btn"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="therapist-login-footer">
          <p className="therapist-login-text">Already have an account?</p>
          <button
            onClick={() => navigate('/login/therapist')}
            className="therapist-login-link"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistRegister; 