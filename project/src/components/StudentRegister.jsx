import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './StudentLogin.css';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    therapistId: ''
  });
  const [therapists, setTherapists] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/therapists');
      const data = await res.json();
      if (res.ok) {
        setTherapists(data.therapists);
      } else {
        setError('Failed to load therapists');
      }
    } catch (err) {
      setError('Failed to load therapists');
    }
  };

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

    if (!formData.therapistId) {
      setError('Please select a therapist');
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: 'student',
      therapistId: formData.therapistId
    };

    const result = await register(userData);
    
    if (result.success) {
      setSuccess('Registration successful! You can now login.');
      setTimeout(() => {
        navigate('/login/student');
      }, 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="student-login-bg">
      <div className="student-login-card">
        <div className="student-login-header">
          <div className="student-login-icon">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="student-login-title">Student Registration</h1>
        </div>
        <form onSubmit={handleSubmit} className="student-login-form">
          <div className="student-login-input-wrap">
            <User className="student-login-icon-left w-5 h-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="student-login-input"
              placeholder="Full Name"
              required
            />
          </div>
          <div className="student-login-input-wrap">
            <Mail className="student-login-icon-left w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="student-login-input"
              placeholder="Email Address"
              required
            />
          </div>
          <div className="student-login-input-wrap">
            <Lock className="student-login-icon-left w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="student-login-input"
              placeholder="Password (min 6 characters)"
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
          <div className="student-login-input-wrap">
            <Lock className="student-login-icon-left w-5 h-5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="student-login-input"
              placeholder="Confirm Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="student-login-icon-right"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="student-login-input-wrap">
            <select
              name="therapistId"
              value={formData.therapistId}
              onChange={handleChange}
              className="student-login-input"
              required
            >
              <option value="">Select Therapist</option>
              {therapists.map((therapist) => (
                <option key={therapist._id} value={therapist._id}>
                  {therapist.name} ({therapist.email})
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="student-login-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="student-login-success">
              <span>{success}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="student-login-btn"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="student-login-footer">
          <p className="student-login-text">Already have an account?</p>
          <button
            onClick={() => navigate('/login/student')}
            className="student-login-link"
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

export default StudentRegister; 