import React, { useState, useEffect } from 'react';
import { User, Calendar, Trophy, TrendingUp, Mail, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './StudentManagement.css';
import PathAssignment from './PathAssignment';

const StudentManagement = () => {
  const { user, getStudents, getPerformance } = useAuth();
  const { getStudentAssignments } = useGame();
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
                onPathAssigned={() => { setShowPathBuilder(false); fetchStudents(); }}
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
        {showPathBuilder && selectedStudent && (
          <div className="modal-overlay">
            <div className="modal-content">
              <PathAssignment
                studentId={selectedStudent._id}
                onPathAssigned={() => setShowPathBuilder(false)}
              />
              <button className="modal-close-btn" onClick={() => setShowPathBuilder(false)}>&times;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StudentCard = ({ student, navigate, onEditPath, onPathAssigned }) => {
  const [progress, setProgress] = useState({
    totalSessions: 0,
    averageScore: 0,
    activeAssignments: 0,
    allAssignmentsCompleted: true
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
      let allAssignmentsCompleted = true;
      if (getStudentAssignments) {
        const assignments = await getStudentAssignments(student._id);
        if (Array.isArray(assignments) && assignments.length > 0) {
          activeAssignments = assignments.filter(a => a.status !== 'completed').length;
          allAssignmentsCompleted = assignments.every(a => a.status === 'completed');
        } else {
          allAssignmentsCompleted = false; // No assignments means not completed
        }
      }

      setProgress({
        totalSessions,
        averageScore,
        activeAssignments,
        allAssignmentsCompleted
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
          src={
            student.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`
          }
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
      {student.subjects && student.subjects.length > 0 && (
        <div className="student-card-subjects">
          <h4 className="student-card-subjects-heading">Subjects:</h4>
          <ul className="student-card-subjects-list">
            {student.subjects.map((subj, idx) => (
              <li key={idx}>
                {subj.name} (Interest: {subj.interest}, Difficulty: {subj.difficulty})
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="student-card-actions">
        <button 
          className="student-card-action-btn student-card-action-btn-blue"
          onClick={() => navigate(`/dashboard/therapist/assignments?student=${student._id}`)}
          disabled={progress.activeAssignments > 0}
          title={progress.activeAssignments > 0 ? 'Student must finish the current game before assigning a new one.' : ''}
        >
          Assign Game
        </button>
        {progress.allAssignmentsCompleted ? (
          <button
            className="student-card-action-btn student-card-action-btn-gradient"
            onClick={onEditPath}
          >
            Assign Path
          </button>
        ) : (
          <button
            className="student-card-action-btn student-card-action-btn-gradient"
            disabled
            title="Student must complete all assigned games before assigning a learning path."
          >
            Waiting for game completion
          </button>
        )}
      </div>
      {progress.activeAssignments > 0 && (
        <div className="student-card-hint student-card-hint-purple">
          Student must finish the current game before assigning a new one.
        </div>
      )}
      {!progress.allAssignmentsCompleted && progress.activeAssignments === 0 && (
        <div className="student-card-hint student-card-hint-yellow">
          No games assigned yet. Assign a game first.
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
