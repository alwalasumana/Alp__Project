import React, { useEffect, useState } from 'react';
import {
  TowerControl as GameController2,
  Trophy,
  Target,
  Clock,
  LogOut,
  Star,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import GameCard from './student/GameCard';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const ALL_GAMES = [
  { id: 'memory-match', name: 'Memory Match', description: 'Match pairs of cards to improve memory and concentration', category: 'memory', difficulty: 'medium', icon: 'Brain', color: 'bg-purple-500', estimatedTime: 10 },
  { id: 'math-challenge', name: 'Math Challenge', description: 'Solve math problems to build numerical skills', category: 'math', difficulty: 'easy', icon: 'Calculator', color: 'bg-green-500', estimatedTime: 15 },
  { id: 'pattern-recognition', name: 'Pattern Recognition', description: 'Identify and complete patterns to enhance logical thinking', category: 'pattern', difficulty: 'hard', icon: 'Puzzle', color: 'bg-blue-500', estimatedTime: 12 }
];

const StudentDashboard = () => {
  const { user, logout, getPerformance } = useAuth();
  const { games, getStudentAssignments, getGameById } = useGame();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [assignedGames, setAssignedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Try to get assignments, do not fallback to all games
      let assigned = [];
      try {
        const assignments = getStudentAssignments ? getStudentAssignments(user._id) : [];
        assigned = assignments
          .filter(assignment => assignment.status !== 'completed')
          .map(assignment => getGameById ? getGameById(assignment.gameId) : null)
          .filter(Boolean);
      } catch (err) {
        assigned = [];
      }
      setAssignedGames(assigned);

      // Fetch performance sessions
      const perfResult = await getPerformance(user._id, null, 100);
      setSessions(perfResult.success ? perfResult.performances : []);
    } catch (error) {
      setAssignedGames([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    if (user?._id) loadData();
  }, [user, getPerformance, getStudentAssignments, getGameById]);

  // Recent sessions
  const recentSessions = sessions
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 3);

  const totalGamesPlayed = sessions.length;
  const averageScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length)
    : 0;

  if (loading) {
    return (
      <div className="student-dashboard-bg">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-bg">
      {/* Header */}
      <div className="student-dashboard-header">
        <div className="student-dashboard-header-inner">
          <div className="student-dashboard-header-left">
            <div className="student-dashboard-header-icon">
              <GameController2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="student-dashboard-header-title">My Learning Journey</h1>
              <p className="student-dashboard-header-welcome">Welcome back, {user?.name}!</p>
            </div>
          </div>
          <div className="student-dashboard-header-right">
            <button
              onClick={handleRefresh}
              className="student-dashboard-refresh"
              style={{ marginRight: '1rem' }}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={logout}
              className="student-dashboard-logout"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="student-dashboard-main">
        {/* Stats Cards */}
        <div className="student-dashboard-stats">
          <div className="student-dashboard-stat-card points">
            <div>
              <p className="student-dashboard-stat-label">Total Points</p>
              <p className="student-dashboard-stat-value">{user?.totalPoints || 0}</p>
            </div>
            <div className="icon">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <div className="student-dashboard-stat-card games">
            <div>
              <p className="student-dashboard-stat-label">Games Played</p>
              <p className="student-dashboard-stat-value">{totalGamesPlayed}</p>
            </div>
            <div className="icon">
              <GameController2 className="w-6 h-6" />
            </div>
          </div>
          <div className="student-dashboard-stat-card score">
            <div>
              <p className="student-dashboard-stat-label">Average Score</p>
              <p className="student-dashboard-stat-value">{averageScore}%</p>
            </div>
            <div className="icon">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Assigned Games */}
        <div className="student-dashboard-assigned-games">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="student-dashboard-section-title">Available Games</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', color: '#6b7280', fontSize: '0.98em' }}>
              <Clock className="w-4 h-4" />
              <span>Ready to play</span>
            </div>
          </div>
          {assignedGames.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              justifyContent: 'flex-start'
            }}>
              {assignedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => {
                    switch (game.id) {
                      case 'memory-match':
                        navigate('/game/memory-match');
                        break;
                      case 'math-challenge':
                        navigate('/game/math-challenge');
                        break;
                      case 'pattern-recognition':
                        navigate('/game/pattern-recognition');
                        break;
                      default:
                        break;
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="student-dashboard-no-games">
              <GameController2 className="w-16 h-16" style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Games Assigned</h3>
              <p>Games will appear here once your therapist assigns them.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="student-dashboard-recent-activity">
          <div className="student-dashboard-recent-activity-header">
            <h3 className="student-dashboard-recent-activity-title">Recent Activity</h3>
          </div>
          <div className="student-dashboard-recent-activity-list">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => {
                const game = games.find(g => g.id === session.gameType);
                return (
                  <div key={session._id || session.id} className="student-dashboard-recent-session">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="icon" style={{ background: game?.color || '#a78bfa' }}>
                        <GameController2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="student-dashboard-recent-session-title">{game?.name}</h4>
                        <p className="student-dashboard-recent-session-date">
                          {new Date(session.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2em' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p className="student-dashboard-recent-session-score">{session.score}%</p>
                        <p className="student-dashboard-recent-session-time">{Math.round(session.timeSpent / 60)}min</p>
                      </div>
                      <div
                        className={
                          'student-dashboard-recent-session-emotion ' +
                          (session.emotionalState === 'happy'
                            ? 'happy'
                            : session.emotionalState === 'excited'
                            ? 'excited'
                            : session.emotionalState === 'frustrated'
                            ? 'frustrated'
                            : 'neutral')
                        }
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '1.5rem 0' }}>
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
