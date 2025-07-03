import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './StudentLogin.css';
import './StudentRegister.css';

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
  const [numberOfSubjects, setNumberOfSubjects] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [step, setStep] = useState(1); // 1: basic info, 2: subjects
  const [loading, setLoading] = useState(false);

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

  const handleBasicInfoSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNumberOfSubjects = (e) => {
    const num = parseInt(e.target.value) || '';
    setNumberOfSubjects(num);
    if (num > 0) {
      setSubjects(Array.from({ length: num }, () => ({
        name: '',
        interest: 'High',
        difficulty: 'Easy'
      })));
    } else {
      setSubjects([]);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    if (!formData.therapistId) {
      setError('Please select a therapist.');
      setLoading(false);
      return;
    }
    try {
      console.log('Registration payload:', {
        ...formData,
        role: 'student',
        subjects
      });
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'student',
          subjects
        })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        // Redirect instantly to student login page
        navigate('/login/student');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-register-bg">
      <div className="student-register-container">
        <h2 className="student-register-title">Student Registration</h2>
        {step === 1 ? (
          <form className="student-register-form" onSubmit={handleBasicInfoSubmit}>
            <div className="student-register-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="student-register-form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="student-register-form-group">
              <label>Password (min 6 characters)</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ flex: 1, paddingRight: '2.5em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="student-register-icon-right"
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '0.5em', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="student-register-form-group">
              <label>Confirm Password</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  style={{ flex: 1, paddingRight: '2.5em' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="student-register-icon-right"
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '0.5em', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="student-register-form-group">
              <label>Select Therapist</label>
              <select
                value={formData.therapistId}
                onChange={e => setFormData({ ...formData, therapistId: e.target.value })}
                className="student-register-input"
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
            <button className="student-register-btn" type="submit">
              Next: Add Subjects
            </button>
            {error && <div className="student-register-error">{error}</div>}
          </form>
        ) : (
          <form className="student-register-form" onSubmit={handleFinalSubmit}>
            <div className="student-register-form-group">
              <label>How many subjects do you study?</label>
              <input
                type="number"
                min="1"
                max="10"
                value={numberOfSubjects}
                onChange={handleNumberOfSubjects}
                required
              />
            </div>
            {subjects.length > 0 && (
              <div className="subjects-section">
                <h3>Enter Your Subjects</h3>
                {subjects.map((subject, idx) => (
                  <div key={idx} className="subject-input-group">
                    <h4>Subject {idx + 1}</h4>
                    <div className="subject-field">
                      <label>Subject Name</label>
                      <input
                        type="text"
                        value={subject.name}
                        onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                        placeholder="e.g., Physics, Chemistry"
                        required
                      />
                    </div>
                    <div className="subject-field">
                      <label>Interest Level</label>
                      <select
                        value={subject.interest}
                        onChange={e => handleSubjectChange(idx, 'interest', e.target.value)}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="subject-field">
                      <label>Difficulty Level</label>
                      <select
                        value={subject.difficulty}
                        onChange={e => handleSubjectChange(idx, 'difficulty', e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="student-register-actions">
              <button
                type="button"
                className="student-register-back-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button className="student-register-btn" type="submit">
                Complete Registration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentRegister; 