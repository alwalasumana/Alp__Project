import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Trophy, Heart, Loader, ArrowLeft } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { useAuth } from '../../contexts/AuthContext';
import './StudentPerformance.css';

const StudentPerformance = ({ onBack }) => {
  const { getGameById } = useGame();
  const { user, getPerformance } = useAuth();
  const [timeRange, setTimeRange] = useState('week');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPerformanceData();
    // eslint-disable-next-line
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const perfResult = await getPerformance(user._id, null, 1000);
      if (!perfResult.success) {
        setError(perfResult.error || 'Failed to fetch performance data');
        setLoading(false);
        return;
      }
      setSessions(perfResult.performances);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions based on time range
  const filteredSessions = sessions.filter(session => {
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

  const getEmotionalStateEmoji = (state) => {
    switch (state) {
      case 'happy': return '😊';
      case 'surprised': return '😮';
      case 'surprise': return '😮';
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
      <div className="student-performance-bg">
        <div className="student-performance-container">
          <div className="student-performance-loading">
            <Loader className="student-performance-loading-icon" />
            <p>Loading your performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-performance-bg">
      <button
        onClick={onBack}
        className="student-performance-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
      <div className="student-performance-container">
        <div className="student-performance-header">
          <h2 className="student-performance-title">My Performance Analytics</h2>
          <div className="student-performance-filters">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="student-performance-select"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="student-performance-stats">
          <div className="student-performance-stat-card">
            <BarChart3 className="student-performance-stat-icon" />
            <div className="student-performance-stat-value">{totalSessions}</div>
            <div className="student-performance-stat-label">Total Sessions</div>
            <div className="student-performance-stat-desc">Games completed</div>
          </div>
          <div className="student-performance-stat-card">
            <Trophy className="student-performance-stat-icon" />
            <div className="student-performance-stat-value">{averageScore}%</div>
            <div className="student-performance-stat-label">Average Score</div>
            <div className="student-performance-stat-desc">Your performance</div>
          </div>
          <div className="student-performance-stat-card">
            <TrendingUp className="student-performance-stat-icon" />
            <div className="student-performance-stat-value">{averageAccuracy}%</div>
            <div className="student-performance-stat-label">Average Accuracy</div>
            <div className="student-performance-stat-desc">Correctness rate</div>
          </div>
          <div className="student-performance-stat-card">
            <Clock className="student-performance-stat-icon" />
            <div className="student-performance-stat-value">{totalTimeSpent}</div>
            <div className="student-performance-stat-label">Total Minutes</div>
            <div className="student-performance-stat-desc">Time engaged</div>
          </div>
        </div>

        {/* Emotional State Analysis */}
        <div className="student-performance-section">
          <div className="student-performance-section-title">
            <Heart className="student-performance-section-title-icon" />
            <span>My Emotional States</span>
          </div>
          {Object.keys(emotionalStates).length > 0 ? (
            <div className="student-performance-emotion-grid">
              {Object.entries(emotionalStates).map(([state, count]) => (
                <div key={state} className="student-performance-emotion-card">
                  <div className="student-performance-emotion-emoji">{getEmotionalStateEmoji(state)}</div>
                  <div className="student-performance-emotion-label">{state}</div>
                  <div className="student-performance-emotion-percent">
                    {Math.round((count / totalEmotions) * 100)}% of emotions
                  </div>
                  <div className="student-performance-emotion-count">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-performance-empty">No emotional state data available for selected time period.</div>
          )}
        </div>

        {/* Game Performance Breakdown */}
        <div className="student-performance-section">
          <div className="student-performance-section-title">Game Performance Breakdown</div>
          {Object.keys(gamePerformance).length > 0 ? (
            <div className="student-performance-game-list">
              {Object.entries(gamePerformance).map(([gameName, data]) => (
                <div key={gameName} className="student-performance-game-card">
                  <div className="student-performance-game-title">{gameName}</div>
                  <div className="student-performance-game-stats">
                    <div className="student-performance-game-stat">
                      <div className="student-performance-game-stat-value">{data.sessions}</div>
                      <div className="student-performance-game-stat-label">Sessions</div>
                    </div>
                    <div className="student-performance-game-stat">
                      <div className="student-performance-game-stat-value">{data.averageScore}%</div>
                      <div className="student-performance-game-stat-label">Avg Score</div>
                    </div>
                    <div className="student-performance-game-stat">
                      <div className="student-performance-game-stat-value">{data.averageAccuracy}%</div>
                      <div className="student-performance-game-stat-label">Avg Accuracy</div>
                    </div>
                    <div className="student-performance-game-stat">
                      <div className="student-performance-game-stat-value">{data.averageTime}m</div>
                      <div className="student-performance-game-stat-label">Avg Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-performance-empty">No performance data available for selected time period.</div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="student-performance-section">
          <div className="student-performance-section-title">My Recent Sessions</div>
          {filteredSessions.length > 0 ? (
            <div className="student-performance-recent-list">
              {filteredSessions
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 10)
                .map((session) => {
                  const game = getGameById(session.gameId);
                  return (
                    <div key={session.id} className="student-performance-recent-card">
                      <div className="student-performance-recent-info">
                        <div className="student-performance-recent-game">
                          {getGameEmoji(session)}
                        </div>
                        <div className="student-performance-recent-details">
                          <div className="student-performance-recent-game-name">{game?.name}</div>
                          <div className="student-performance-recent-date">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="student-performance-recent-stats">
                        <div className="student-performance-recent-stat">
                          <div className="student-performance-recent-stat-value">{session.score}%</div>
                          <div className="student-performance-recent-stat-label">Score</div>
                        </div>
                        <div className="student-performance-recent-stat">
                          <div className="student-performance-recent-stat-value">{Math.round(session.timeSpent / 60)}m</div>
                          <div className="student-performance-recent-stat-label">Time</div>
                        </div>
                        <div className="student-performance-recent-stat">
                          {(() => {
                            const mostFrequentEmotion = getMostFrequentEmotion(session.emotions) || session.emotionalState || 'neutral';
                            return (
                              <div className="student-performance-recent-stat">
                                <div className="student-performance-recent-emoji">{getEmotionalStateEmoji(mostFrequentEmotion)}</div>
                                <div className="student-performance-recent-stat-label">{mostFrequentEmotion}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="student-performance-empty">No recent sessions found for selected time period.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance; 