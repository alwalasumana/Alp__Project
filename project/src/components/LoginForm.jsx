import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <LogIn className="login-logo-icon" />
            </div>
            <h1 className="login-title">Welcome to ALP</h1>
            <p className="login-subtitle">Adaptive Learning Path Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div>
              <label className="login-label">
                Email Address
              </label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="login-label">
                Password
              </label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle className="login-error-icon" />
                <span className="login-error-text">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="login-btn"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;