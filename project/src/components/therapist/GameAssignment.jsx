import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TowerControl as GameController2, User, Calendar, Plus, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './GameAssignment.css';

const GameAssignment = () => {
  const { user, getStudents } = useAuth();
  const { games, assignments, assignGame, getGameById } = useGame();
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleAssignGame = (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedGame) return;
    assignGame({
      studentId: selectedStudent,
      gameId: selectedGame,
      assignedBy: user._id,
      notes: assignmentNotes
    });
    setSelectedStudent('');
    setSelectedGame('');
    setAssignmentNotes('');
    setShowAssignForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'assigned': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="game-assignment-bg">
        <div className="game-assignment-container">
          <div className="game-assignment-loading">
            <Loader className="game-assignment-loading-icon" />
            <p>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-assignment-bg">
      <button
        onClick={() => navigate('/dashboard/therapist')}
        className="game-assignment-dashboard-btn"
      >
        Back to Dashboard
      </button>
      <div className="game-assignment-container">
        <div className="game-assignment-header">
          <h2 className="game-assignment-title">Game Assignments</h2>
          <button
            onClick={() => setShowAssignForm(true)}
            className="game-assignment-add-btn"
            disabled={students.length === 0}
          >
            <Plus className="game-assignment-add-icon" />
            <span>Assign Game</span>
          </button>
        </div>
        {showAssignForm && (
          <div className="game-assignment-form-bg">
            <h3 className="game-assignment-form-title">Assign New Game</h3>
            <form onSubmit={handleAssignGame} className="game-assignment-form">
              <div className="game-assignment-form-row">
                <div>
                  <label className="game-assignment-label">Select Student</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="game-assignment-select"
                    required
                  >
                    <option value="">Choose a student...</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="game-assignment-label">Select Game</label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="game-assignment-select"
                    required
                  >
                    <option value="">Choose a game...</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>{game.name} - {game.difficulty}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="game-assignment-label">Assignment Notes (Optional)</label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add any specific instructions or goals for this assignment..."
                  className="game-assignment-notes"
                />
              </div>
              <div className="game-assignment-form-actions">
                <button
                  type="button"
                  onClick={() => setShowAssignForm(false)}
                  className="game-assignment-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="game-assignment-submit-btn"
                >
                  Assign Game
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="game-assignment-list">
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              const game = getGameById(assignment.gameId);
              const student = students.find(s => s._id === assignment.studentId);
              return (
                <div key={assignment.id} className="game-assignment-card">
                  <div className="game-assignment-card-header">
                    <div className="game-assignment-card-header-left">
                      <div className={`game-assignment-game-icon ${game?.color || ''}`}>
                        <GameController2 className="game-assignment-game-icon-svg" />
                      </div>
                      <div>
                        <h3 className="game-assignment-card-title">{game?.name}</h3>
                        <div className="game-assignment-card-student">
                          <User className="game-assignment-card-student-icon" />
                          <span>Assigned to: {student?.name || 'Unknown Student'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`game-assignment-status ${assignment.status}`}> 
                      {getStatusIcon(assignment.status)}
                      <span className="game-assignment-status-label">{assignment.status}</span>
                    </div>
                  </div>
                  <div className="game-assignment-card-info">
                    <div className="game-assignment-card-info-row">
                      <Calendar className="game-assignment-card-info-icon" />
                      <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="game-assignment-card-info-row">
                      <span className="game-assignment-card-info-label">Difficulty:</span> {game?.difficulty}
                    </div>
                    <div className="game-assignment-card-info-row">
                      <span className="game-assignment-card-info-label">Est. Time:</span> {game?.estimatedTime} min
                    </div>
                  </div>
                  {assignment.notes && (
                    <div className="game-assignment-card-notes">
                      <p className="game-assignment-card-notes-title">Assignment Notes:</p>
                      <p className="game-assignment-card-notes-content">{assignment.notes}</p>
                    </div>
                  )}
                  <p className="game-assignment-card-description">{game?.description}</p>
                </div>
              );
            })
          ) : (
            <div className="game-assignment-empty">
              <GameController2 className="game-assignment-empty-icon" />
              <h3 className="game-assignment-empty-title">No Assignments Yet</h3>
              <p className="game-assignment-empty-desc">
                {students.length === 0 
                  ? 'You need students to assign games to. Students will appear here once they register.'
                  : 'Start by assigning games to your students to track their progress.'
                }
              </p>
              {students.length > 0 && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="game-assignment-add-btn"
                >
                  Assign Your First Game
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameAssignment;