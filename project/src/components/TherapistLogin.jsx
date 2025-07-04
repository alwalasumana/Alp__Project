import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Users, Eye, EyeOff, UserPlus, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './TherapistLogin.css';

const TherapistLogin = () => {
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
        if (data.user.role === 'superadmin') {
          navigate('/dashboard/superadmin');
        } else {
          navigate('/dashboard/therapist');
        }
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="therapist-login-bg">
      <div className="therapist-login-card">
        <div className="therapist-login-header">
          <div className="therapist-login-icon">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="therapist-login-title">Therapist Login</h1>
        </div>
        <form onSubmit={handleSubmit} className="therapist-login-form">
          <div className="therapist-login-input-wrap">
            <Mail className="therapist-login-icon-left w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="therapist-login-input"
              placeholder="Email"
              required
            />
          </div>
          <div className="therapist-login-input-wrap">
            <Lock className="therapist-login-icon-left w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="therapist-login-input"
              placeholder="Password"
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
          {error && (
            <div className="therapist-login-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="therapist-login-btn"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="therapist-login-footer">
          <p className="therapist-login-text">Don't have an account?</p>
          <button
            onClick={() => navigate('/register/therapist')}
            className="therapist-login-link"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            Sign Up as Therapist
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapistLogin;
