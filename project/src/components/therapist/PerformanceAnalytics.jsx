import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Clock, Trophy, Heart, User, Calendar, Loader } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import './PerformanceAnalytics.css';

const PerformanceAnalytics = () => {
  const { getGameById } = useGame();
  const { getStudents, getPerformance } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [timeRange, setTimeRange] = useState('week');
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const studentsResult = await getStudents();
      if (!studentsResult.success) {
        setError(studentsResult.error || 'Failed to fetch students');
        setLoading(false);
        return;
      }
      setStudents(studentsResult.students);

      // Fetch all performances for all students
      let allSessions = [];
      for (const student of studentsResult.students) {
        const perfResult = await getPerformance(student._id, null, 1000);
        if (perfResult.success) {
          // Attach studentId to each session for filtering
          allSessions = allSessions.concat(
            perfResult.performances.map(perf => ({
              ...perf,
              studentId: student._id
            }))
          );
        }
      }
      setSessions(allSessions);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions based on selected student and time range
  const filteredSessions = sessions.filter(session => {
    if (selectedStudent !== 'all' && session.studentId !== selectedStudent) {
      return false;
    }
    
    const sessionDate = new Date(session.completedAt);
    const now = new Date();
    const daysAgo = (now - sessionDate) / (1000 * 60 * 60 * 24);
    
    switch (timeRange) {
      case 'week':
        return daysAgo <= 7;
      case 'month':
        return daysAgo <= 30;
      case 'quarter':
        return daysAgo <= 90;
      default:
        return true;
    }
  });

  // Calculate analytics
  const totalSessions = filteredSessions.length;
  const averageScore = totalSessions > 0 
    ? Math.round(filteredSessions.reduce((sum, session) => sum + session.score, 0) / totalSessions)
    : 0;
  const averageAccuracy = totalSessions > 0 
    ? Math.round(filteredSessions.reduce((sum, session) => sum + session.accuracy * 100, 0) / totalSessions)
    : 0;
  const totalTimeSpent = Math.round(filteredSessions.reduce((sum, session) => sum + session.timeSpent, 0) / 60);

  // Emotional state distribution
  const emotionalStates = filteredSessions.reduce((acc, session) => {
    const state = session.emotionalState || 'neutral';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  // Game performance breakdown
  const gamePerformance = filteredSessions.reduce((acc, session) => {
    const game = getGameById(session.gameId);
    const gameName = game?.name || 'Activities:';
    
    if (!acc[gameName]) {
      acc[gameName] = {
        sessions: 0,
        totalScore: 0,
        totalAccuracy: 0,
        totalTime: 0
      };
    }
    
    acc[gameName].sessions += 1;
    acc[gameName].totalScore += session.score;
    acc[gameName].totalAccuracy += session.accuracy * 100;
    acc[gameName].totalTime += session.timeSpent;
    
    return acc;
  }, {});

  // Calculate averages for game performance
  Object.keys(gamePerformance).forEach(gameName => {
    const data = gamePerformance[gameName];
    data.averageScore = Math.round(data.totalScore / data.sessions);
    data.averageAccuracy = Math.round(data.totalAccuracy / data.sessions);
    data.averageTime = Math.round(data.totalTime / data.sessions / 60);
  });

  const getEmotionalStateColor = (state) => {
    switch (state) {
      case 'happy':
        return 'bg-green-100 text-green-800';
      case 'excited':
        return 'bg-yellow-100 text-yellow-800';
      case 'frustrated':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmotionalStateEmoji = (state) => {
    switch (state) {
      case 'happy':
        return '😊';
      case 'excited':
        return '🤩';
      case 'frustrated':
        return '😤';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

  if (loading) {
    return (
      <div className="performance-analytics-bg">
        <div className="performance-analytics-container">
          <div className="performance-analytics-loading">
            <Loader className="performance-analytics-loading-icon" />
            <p>Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-analytics-bg">
      <button
        onClick={() => navigate('/dashboard/therapist')}
        className="performance-analytics-dashboard-btn"
      >
        Back to Dashboard
      </button>
      <div className="performance-analytics-container">
        <div className="performance-analytics-header">
          <h2 className="performance-analytics-title">Performance Analytics</h2>
          <div className="performance-analytics-filters">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="performance-analytics-select"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="performance-analytics-select"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="performance-analytics-stats">
          <div className="performance-analytics-stat-card">
            <BarChart3 className="performance-analytics-stat-icon" />
            <div className="performance-analytics-stat-value">{totalSessions}</div>
            <div className="performance-analytics-stat-label">Total Sessions</div>
            <div className="performance-analytics-stat-desc">Games completed</div>
          </div>
          <div className="performance-analytics-stat-card">
            <Trophy className="performance-analytics-stat-icon" />
            <div className="performance-analytics-stat-value">{averageScore}%</div>
            <div className="performance-analytics-stat-label">Average Score</div>
            <div className="performance-analytics-stat-desc">Overall performance</div>
          </div>
          <div className="performance-analytics-stat-card">
            <TrendingUp className="performance-analytics-stat-icon" />
            <div className="performance-analytics-stat-value">{averageAccuracy}%</div>
            <div className="performance-analytics-stat-label">Average Accuracy</div>
            <div className="performance-analytics-stat-desc">Correctness rate</div>
          </div>
          <div className="performance-analytics-stat-card">
            <Clock className="performance-analytics-stat-icon" />
            <div className="performance-analytics-stat-value">{totalTimeSpent}</div>
            <div className="performance-analytics-stat-label">Total Minutes</div>
            <div className="performance-analytics-stat-desc">Time engaged</div>
          </div>
        </div>

        {/* Emotional State Analysis */}
        <div className="performance-analytics-section">
          <div className="performance-analytics-section-title">
            <Heart className="performance-analytics-section-title-icon" />
            <span>Emotional State Distribution</span>
          </div>
          {Object.keys(emotionalStates).length > 0 ? (
            <div className="performance-analytics-emotion-grid">
              {Object.entries(emotionalStates).map(([state, count]) => (
                <div key={state} className="performance-analytics-emotion-card">
                  <div className="performance-analytics-emotion-emoji">{getEmotionalStateEmoji(state)}</div>
                  <div className="performance-analytics-emotion-label">{state}</div>
                  <div className="performance-analytics-emotion-percent">
                    {Math.round((count / totalSessions) * 100)}% of sessions
                  </div>
                  <div className="performance-analytics-emotion-count">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="performance-analytics-empty">No emotional state data available for selected filters.</div>
          )}
        </div>

        {/* Game Performance Breakdown */}
        <div className="performance-analytics-section">
          <div className="performance-analytics-section-title">Game Performance Breakdown</div>
          {Object.keys(gamePerformance).length > 0 ? (
            <div className="performance-analytics-game-list">
              {Object.entries(gamePerformance).map(([gameName, data]) => (
                <div key={gameName} className="performance-analytics-game-card">
                  <div className="performance-analytics-game-title">{gameName}</div>
                  <div className="performance-analytics-game-stats">
                    <div className="performance-analytics-game-stat">
                      <div className="performance-analytics-game-stat-value">{data.sessions}</div>
                      <div className="performance-analytics-game-stat-label">Sessions</div>
                    </div>
                    <div className="performance-analytics-game-stat">
                      <div className="performance-analytics-game-stat-value">{data.averageScore}%</div>
                      <div className="performance-analytics-game-stat-label">Avg Score</div>
                    </div>
                    <div className="performance-analytics-game-stat">
                      <div className="performance-analytics-game-stat-value">{data.averageAccuracy}%</div>
                      <div className="performance-analytics-game-stat-label">Avg Accuracy</div>
                    </div>
                    <div className="performance-analytics-game-stat">
                      <div className="performance-analytics-game-stat-value">{data.averageTime}m</div>
                      <div className="performance-analytics-game-stat-label">Avg Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="performance-analytics-empty">No performance data available for selected filters.</div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="performance-analytics-section">
          <div className="performance-analytics-section-title">Recent Sessions</div>
          {filteredSessions.length > 0 ? (
            <div className="performance-analytics-recent-list">
              {filteredSessions
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 10)
                .map((session) => {
                  const game = getGameById(session.gameId);
                  const student = students.find(s => s._id === session.studentId);
                  return (
                    <div key={session.id} className="performance-analytics-recent-card">
                      <div className="performance-analytics-recent-info">
                        <div className="performance-analytics-recent-game">
                          {game?.name?.charAt(0) || 'G'}
                        </div>
                        <div className="performance-analytics-recent-details">
                          <div className="performance-analytics-recent-student">{student?.name}</div>
                          <div className="performance-analytics-recent-game-name">{game?.name}</div>
                        </div>
                      </div>
                      <div className="performance-analytics-recent-stats">
                        <div className="performance-analytics-recent-stat">
                          <div className="performance-analytics-recent-stat-value">{session.score}%</div>
                          <div className="performance-analytics-recent-stat-label">Score</div>
                        </div>
                        <div className="performance-analytics-recent-stat">
                          <div className="performance-analytics-recent-stat-value">{Math.round(session.timeSpent / 60)}m</div>
                          <div className="performance-analytics-recent-stat-label">Time</div>
                        </div>
                        <div className="performance-analytics-recent-stat">
                          <div className="performance-analytics-recent-emoji">{getEmotionalStateEmoji(session.emotionalState || 'neutral')}</div>
                          <div className="performance-analytics-recent-stat-label">{session.emotionalState || 'neutral'}</div>
                        </div>
                        <div className="performance-analytics-recent-date">
                          <div>{new Date(session.completedAt).toLocaleDateString()}</div>
                          <div>{new Date(session.completedAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="performance-analytics-empty">No recent sessions found for selected filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;