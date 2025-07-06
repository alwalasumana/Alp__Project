import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Clock, Trophy, Heart, User, Calendar, Loader, Brain, Sparkles } from 'lucide-react';
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
        setLoading(false);
        return;
      }
      setStudents(studentsResult.students);

      // Fetch all performances for all students in parallel
      const performancePromises = studentsResult.students.map(student =>
        getPerformance(student._id, null, 1000).then(perfResult => ({
          studentId: student._id,
          performances: perfResult.success ? perfResult.performances : []
        }))
      );

      const allResults = await Promise.all(performancePromises);

      const allSessions = allResults.flatMap(result =>
        result.performances.map(perf => ({
          ...perf,
          studentId: result.studentId
        }))
      );

      setSessions(allSessions);
    } catch (err) {
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

  // For Memory Match, use moves as the main metric
  const memorySessions = filteredSessions.filter(session => session.gameType === 'memory' || session.gameId === 'memory-match');
  const nonMemorySessions = filteredSessions.filter(session => !(session.gameType === 'memory' || session.gameId === 'memory-match'));

  const averageScore = totalSessions > 0
    ? Math.round(
        nonMemorySessions.length > 0
          ? nonMemorySessions.reduce((sum, session) => sum + session.score, 0) / nonMemorySessions.length
          : memorySessions.length > 0
            ? memorySessions.reduce((sum, session) => sum + (session.moves || session.score), 0) / memorySessions.length
            : 0
      )
    : 0;
  const averageMoves = memorySessions.length > 0
    ? Math.round(memorySessions.reduce((sum, session) => sum + (session.moves || session.score), 0) / memorySessions.length)
    : 0;
  const averageAccuracy = totalSessions > 0 
    ? Math.round(filteredSessions.reduce((sum, session) => sum + session.accuracy * 100, 0) / totalSessions)
    : 0;
  const totalTimeSpent = Math.round(filteredSessions.reduce((sum, session) => sum + session.timeSpent, 0) / 60);

  // Aggregate all emotions from all sessions
  const allEmotions = filteredSessions.flatMap(session =>
    Array.isArray(session.emotions) && session.emotions.length > 0
      ? session.emotions.map(e => typeof e === 'string' ? e : e.emotion)
      : [session.emotionalState || 'neutral']
  );
  const emotionalStates = allEmotions.reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {});
  const totalEmotions = allEmotions.length;

  // Game performance breakdown
  const gamePerformance = filteredSessions.reduce((acc, session) => {
    const game = getGameById(session.gameId);
    const gameName = game?.name || 'Activities:';
    if (!acc[gameName]) {
      acc[gameName] = {
        sessions: 0,
        totalScore: 0,
        totalMoves: 0,
        totalAccuracy: 0,
        totalTime: 0,
        isMemory: (session.gameType === 'memory' || session.gameId === 'memory-match')
      };
    }
    acc[gameName].sessions += 1;
    if (acc[gameName].isMemory) {
      acc[gameName].totalMoves += session.moves || session.score;
    } else {
      acc[gameName].totalScore += session.score;
    }
    acc[gameName].totalAccuracy += session.accuracy * 100;
    acc[gameName].totalTime += session.timeSpent;
    return acc;
  }, {});

  // Calculate averages for game performance
  Object.keys(gamePerformance).forEach(gameName => {
    const data = gamePerformance[gameName];
    // Always calculate averageScore, even for memory games (use moves if no score)
    if (data.sessions > 0) {
      data.averageScore = Math.round(
        data.isMemory && data.totalScore === 0
          ? data.totalMoves / data.sessions // fallback to moves if no score
          : data.totalScore / data.sessions
      );
      if (data.isMemory) {
        data.averageMoves = Math.round(data.totalMoves / data.sessions);
      }
      data.averageAccuracy = Math.round(data.totalAccuracy / data.sessions);
      data.averageTime = Math.round(data.totalTime / data.sessions / 60);
    } else {
      data.averageScore = 0;
      data.averageMoves = 0;
      data.averageAccuracy = 0;
      data.averageTime = 0;
    }
  });

  const getEmotionalStateEmoji = (state) => {
    switch (state) {
      case 'happy': return '😊';
      case 'surprised': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'fear': return '😨';
      case 'disgust': return '🤢';
      case 'frustrated': return '😤';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  // Helper to get the most frequent emotion from an array
  function getMostFrequentEmotion(emotions) {
    if (!emotions || emotions.length === 0) return 'neutral';
    const freq = {};
    emotions.forEach(e => {
      const emotion = typeof e === 'string' ? e : e.emotion;
      freq[emotion] = (freq[emotion] || 0) + 1;
    });
    return Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  // Map gameId to emoji for display
  function getGameEmoji(session) {
    const id = session.gameId || session.gameType || '';
    if (id.includes('math')) return '🧮';
    if (id.includes('memory')) return '🧠';
    if (id.includes('pattern')) return '🧩';
    return '🎮';
  }

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
          <div className="performance-analytics-header-left">
            <h2 className="performance-analytics-title">Performance Analytics</h2>
            <p className="performance-analytics-subtitle">
              Analyze student performance and generate adaptive learning paths
            </p>
          </div>
          <div className="performance-analytics-header-right">
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
                    {Math.round((count / totalEmotions) * 100)}% of emotions
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
                    {gameName === 'Activities:' ? (
                      <div className="performance-analytics-game-stat">
                        <div className="performance-analytics-game-stat-value">{data.averageScore}%</div>
                        <div className="performance-analytics-game-stat-label">Avg Score</div>
                      </div>
                    ) : data.isMemory ? (
                      <div className="performance-analytics-game-stat">
                        <div className="performance-analytics-game-stat-value">{data.averageMoves} moves</div>
                        <div className="performance-analytics-game-stat-label">Avg Moves</div>
                      </div>
                    ) : (
                      <div className="performance-analytics-game-stat">
                        <div className="performance-analytics-game-stat-value">{data.averageScore}%</div>
                        <div className="performance-analytics-game-stat-label">Avg Score</div>
                      </div>
                    )}
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
                  const isMemory = session.gameType === 'memory' || session.gameId === 'memory-match';
                  return (
                    <div key={session.id || session._id} className="performance-analytics-recent-card">
                      <div className="performance-analytics-recent-info">
                        <div className="performance-analytics-recent-game">
                          {getGameEmoji(session)}
                        </div>
                        <div className="performance-analytics-recent-details">
                          <div className="performance-analytics-recent-student">{student?.name}</div>
                          <div className="performance-analytics-recent-game-name">{game?.name}</div>
                        </div>
                      </div>
                      <div className="performance-analytics-recent-stats">
                        <div className="performance-analytics-recent-stat">
                          <div className="performance-analytics-recent-stat-value">
                            {isMemory ? `${session.moves || session.score} moves` : `${session.score}%`}
                          </div>
                          <div className="performance-analytics-recent-stat-label">{isMemory ? 'Moves' : 'Score'}</div>
                        </div>
                        <div className="performance-analytics-recent-stat">
                          <div className="performance-analytics-recent-stat-value">{Math.round(session.timeSpent / 60)}m</div>
                          <div className="performance-analytics-recent-stat-label">Time</div>
                        </div>
                        <div className="performance-analytics-recent-stat">
                          {(() => {
                            const mostFrequentEmotion = getMostFrequentEmotion(session.emotions) || session.emotionalState || 'neutral';
                            return (
                              <div className="performance-analytics-recent-stat">
                                <div className="performance-analytics-recent-emoji">{getEmotionalStateEmoji(mostFrequentEmotion)}</div>
                                <div className="performance-analytics-recent-stat-label">{mostFrequentEmotion}</div>
                              </div>
                            );
                          })()}
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