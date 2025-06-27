import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './StudentLogin.css';

const ForgotPassword = ({ userType }) => {
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    const result = await forgotPassword(email.trim().toLowerCase());
    
    if (result.success) {
      setResetToken(result.resetToken);
      setStep('reset');
      setSuccess('Please enter your new password below.');
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await resetPassword(resetToken, newPassword);
    
    if (result.success) {
      setSuccess('Password reset successfully! You can now login with your new password.');
      setTimeout(() => {
        navigate(`/login/${userType}`);
      }, 2000);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const getTitle = () => {
    return userType === 'student' ? 'Student Password Reset' : 'Therapist Password Reset';
  };

  const getIcon = () => {
    return userType === 'student' ? '🎓' : '👨‍⚕️';
  };

  return (
    <div className="student-login-bg">
      <div className="student-login-card">
        <div className="student-login-header">
          <div className="student-login-icon">
            <span className="text-2xl">{getIcon()}</span>
          </div>
          <h1 className="student-login-title">{getTitle()}</h1>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="student-login-form">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="student-login-input-wrap">
              <Mail className="student-login-icon-left w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="student-login-input"
                placeholder="Enter your email address"
                required
              />
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="student-login-form">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter your new password below.
            </p>
            <div className="student-login-input-wrap">
              <Lock className="student-login-icon-left w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="student-login-input"
                placeholder="New Password (min 6 characters)"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="student-login-input"
                placeholder="Confirm New Password"
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
            {error && (
              <div className="student-login-error">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="student-login-success">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="student-login-btn"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="student-login-footer">
          <button
            onClick={() => navigate(`/login/${userType}`)}
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

export default ForgotPassword; 