import React, { useState, useEffect } from 'react';
import { User, Calendar, Trophy, TrendingUp, Mail, Phone, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './StudentManagement.css';

const StudentManagement = () => {
  const { user, getStudents, getPerformance } = useAuth();
  const { getStudentSessions, getStudentAssignments } = useGame();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPathBuilder, setShowPathBuilder] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const result = await getStudents();
      if (result.success) {
        setStudents(result.students);
      } else {
        setError(result.error || 'Failed to fetch students');
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentProgress = async (studentId) => {
    try {
      const result = await getPerformance(studentId);
      if (result.success) {
        const performances = result.performances;
        const totalSessions = performances.length;
        const averageScore = totalSessions > 0 
          ? Math.round(performances.reduce((sum, perf) => sum + perf.score, 0) / totalSessions)
          : 0;
        
        return {
          totalSessions,
          averageScore,
          completedAssignments: 0, // Will be updated when assignments are implemented
          activeAssignments: 0
        };
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
    }
    
    return {
      totalSessions: 0,
      averageScore: 0,
      completedAssignments: 0,
      activeAssignments: 0
    };
  };

  if (loading) {
    return (
      <div className="student-management-bg">
        <div className="student-management-container">
          <div className="student-management-loading">
            <Loader className="student-management-loading-icon" />
            <p>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-management-bg">
        <div className="student-management-container">
          <div className="student-management-error">
            <p>{error}</p>
            <button onClick={fetchStudents} className="student-management-retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-management-bg">
      <div className="student-management-container">
        <div className="student-management-header">
          <h2 className="student-management-title">My Students</h2>
          <div className="student-management-total">Total Students: {students.length}</div>
        </div>
        {students.length > 0 ? (
          <div className="student-management-grid">
            {students.map((student) => (
              <StudentCard key={student._id} student={student} navigate={navigate}
                onEditPath={() => { setSelectedStudent(student); setShowPathBuilder(true); }}
              />
            ))}
          </div>
        ) : (
          <div className="student-management-empty">
            <User className="student-management-empty-icon" />
            <h3>No Students Yet</h3>
            <p>Students will appear here once they register and are assigned to you.</p>
          </div>
        )}
        <div className="student-management-dashboard-btn-wrap">
          <button
            onClick={() => navigate('/dashboard/therapist')}
            className="student-management-dashboard-btn"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const StudentCard = ({ student, navigate, onEditPath }) => {
  const [progress, setProgress] = useState({
    totalSessions: 0,
    averageScore: 0,
    activeAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const { getPerformance } = useAuth();
  const { getStudentAssignments } = useGame();

  useEffect(() => {
    fetchStudentProgress();
  }, [student._id]);

  const fetchStudentProgress = async () => {
    try {
      // Fetch performance
      const perfResult = await getPerformance(student._id);
      let totalSessions = 0;
      let averageScore = 0;
      if (perfResult.success && perfResult.performances.length > 0) {
        totalSessions = perfResult.performances.length;
        averageScore = Math.round(
          perfResult.performances.reduce((sum, perf) => sum + perf.score, 0) / totalSessions
        );
      }

      // Fetch assignments
      let activeAssignments = 0;
      if (getStudentAssignments) {
        const assignments = getStudentAssignments(student._id);
        if (Array.isArray(assignments)) {
          activeAssignments = assignments.filter(a => a.status === 'active' || a.status === 'assigned').length;
        }
      }

      setProgress({
        totalSessions,
        averageScore,
        activeAssignments
      });
    } catch (err) {
      console.error('Error fetching student progress:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-card">
      <div className="student-card-top">
        <img
          src={student.avatar || 'https://images.pexels.com/photos/8923059/pexels-photo-8923059.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={student.name}
          className="student-card-avatar"
        />
        <div>
          <h3 className="student-card-name">{student.name}</h3>
        </div>
      </div>
      <div className="student-card-stats">
        <div className="student-card-stat">
          <Trophy className="student-card-stat-icon student-card-stat-icon-yellow" />
          <p className="student-card-stat-value">{student.totalPoints}</p>
          <p className="student-card-stat-label">Points</p>
        </div>
        <div className="student-card-stat">
          <TrendingUp className="student-card-stat-icon student-card-stat-icon-green" />
          <p className="student-card-stat-value">{loading ? '...' : `${progress.averageScore}%`}</p>
          <p className="student-card-stat-label">Avg Score</p>
        </div>
      </div>
      <div className="student-card-progress">
        <div className="student-card-progress-row">
          <span>Sessions Completed</span>
          <span>{loading ? '...' : progress.totalSessions}</span>
        </div>
        <div className="student-card-progress-row">
          <span>Active Assignments</span>
          <span className="student-card-progress-active">{loading ? '...' : progress.activeAssignments}</span>
        </div>
      </div>
      <div className="student-card-contact">
        <div className="student-card-contact-row">
          <Mail className="student-card-contact-icon" />
          <span>{student.email}</span>
        </div>
        <div className="student-card-contact-row">
          <Calendar className="student-card-contact-icon" />
          <span>Joined: {new Date(student.joinDate).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="student-card-actions">
        <button 
          className="student-card-action-btn student-card-action-btn-blue"
          onClick={() => navigate(`/dashboard/therapist/assignments?student=${student._id}`)}
        >
          Assign Game
        </button>
      </div>
    </div>
  );
};

export default StudentManagement;
