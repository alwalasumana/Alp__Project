import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Heart, Star } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-bg">
      <div className="landing-header">
        <div className="landing-logo">
          <Brain className="landing-logo-icon" />
        </div>
        <h1 className="landing-title">Adapto</h1>
        <p className="landing-subtitle">Emotion-Centric Adaptive Education</p>
        <p className="landing-desc">
          Personalized, emotion-aware learning games for students and therapists.
        </p>
      </div>
      <div className="landing-features">
        <div className="landing-feature">
          <Heart className="landing-feature-icon heart" />
          <span className="landing-feature-label">Emotion-Aware</span>
        </div>
        <div className="landing-feature">
          <Star className="landing-feature-icon star" />
          <span className="landing-feature-label">Adaptive Games</span>
        </div>
        <div className="landing-feature">
          <Brain className="landing-feature-icon brain" />
          <span className="landing-feature-label">Therapist Insights</span>
        </div>
      </div>
      <div className="landing-card">
        <button
          onClick={() => navigate('/login/student')}
          className="landing-btn student"
        >
          Student Login
        </button>
        <button
          onClick={() => navigate('/login/therapist')}
          className="landing-btn therapist"
        >
          Therapist Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
