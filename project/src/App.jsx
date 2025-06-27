import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { GameProvider } from './contexts/GameContext.jsx';
import LandingPage from './components/LandingPage.jsx';
import StudentLogin from './components/StudentLogin.jsx';
import TherapistLogin from './components/TherapistLogin.jsx';
import StudentRegister from './components/StudentRegister.jsx';
import TherapistRegister from './components/TherapistRegister.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';
import TherapistDashboard from './components/TherapistDashboard';
import StudentDashboard from './components/StudentDashboard';
import MathChallengeGame from './components/games/MathChallengeGame.jsx';
import MemoryMatchGame from './components/games/MemoryMatchGame.jsx';
import PatternRecognitionGame from './components/games/PatternRecognitionGame.jsx';
import GameAssignment from './components/therapist/GameAssignment.jsx';
import PerformanceAnalytics from './components/therapist/PerformanceAnalytics.jsx';
import StudentManagement from './components/therapist/StudentManagement.jsx';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/student" element={<StudentLogin />} />
      <Route path="/login/therapist" element={<TherapistLogin />} />
      <Route path="/register/student" element={<StudentRegister />} />
      <Route path="/register/therapist" element={<TherapistRegister />} />
      <Route path="/forgot-password/student" element={<ForgotPassword userType="student" />} />
      <Route path="/forgot-password/therapist" element={<ForgotPassword userType="therapist" />} />
      <Route path="/dashboard/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/" />} />
      <Route path="/dashboard/therapist" element={user?.role === 'therapist' ? <TherapistDashboard /> : <Navigate to="/" />} />
      <Route path="/game/math-challenge" element={<MathChallengeGame />} />
      <Route path="/game/memory-match" element={<MemoryMatchGame />} />
      <Route path="/game/pattern-recognition" element={<PatternRecognitionGame />} />
      <Route path="/dashboard/therapist/assignments" element={<GameAssignment />} />
      <Route path="/dashboard/therapist/analytics" element={<PerformanceAnalytics />} />
      <Route path="/dashboard/therapist/students" element={<StudentManagement />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <AppRoutes />
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;