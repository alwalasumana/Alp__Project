import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  TowerControl as GameController2,
  BarChart3,
  LogOut,
  Calendar,
  TrendingUp,
  Loader,
} from 'lucide-react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import './TherapistDashboard.css';

const TherapistDashboard = () => {
  const { user, logout, getStudents, getPerformance } = useAuth();
  const { gameSessions, assignments, getAllAssignments } = useGame();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSessions: 0,
    activeAssignments: 0,
    avgPerformance: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get students
      const studentsResult = await getStudents();
      const totalStudents = studentsResult.success ? studentsResult.students.length : 0;
      
      // Get total sessions from all students
      let totalSessions = 0;
      let totalScore = 0;
      
      if (studentsResult.success) {
        for (const student of studentsResult.students) {
          const performanceResult = await getPerformance(student._id);
          if (performanceResult.success) {
            totalSessions += performanceResult.performances.length;
            totalScore += performanceResult.performances.reduce((sum, perf) => sum + perf.score, 0);
          }
        }
      }
      
      const avgPerformance = totalSessions > 0 ? Math.round(totalScore / totalSessions) : 0;
      const activeAssignments = assignments.filter(a => a.status !== 'completed').length;
      
      setStats({
        totalStudents,
        totalSessions,
        activeAssignments,
        avgPerformance
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [getStudents, getPerformance, assignments]);

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      // Refresh assignments first
      await getAllAssignments();
      // Then refresh dashboard stats
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh assignments when they change
  useEffect(() => {
    const interval = setInterval(() => {
      getAllAssignments();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [getAllAssignments]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const tabs = [
    { path: 'students', icon: Users, label: 'Students' },
    { path: 'assignments', icon: GameController2, label: 'Game Assignments' },
    { path: 'analytics', icon: BarChart3, label: 'Performance Analytics' },
  ];

  return (
    <div className="therapist-dashboard-bg">
      {/* Header */}
      <div className="therapist-dashboard-header">
        <div className="therapist-dashboard-header-inner">
          <div className="therapist-dashboard-header-left">
            <div className="therapist-dashboard-logo">
              <Users className="therapist-dashboard-logo-icon" />
            </div>
            <div>
              <h1 className="therapist-dashboard-title">ALP Therapist Portal</h1>
              <p className="therapist-dashboard-welcome">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="therapist-dashboard-header-right">
            <button
              onClick={refreshDashboard}
              className="student-dashboard-refresh"
              style={{ marginRight: '1rem' }}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="therapist-dashboard-logout"
            >
              <LogOut className="therapist-dashboard-logout-icon" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="therapist-dashboard-content">
        {/* Stats Cards */}
        <div className="therapist-dashboard-stats">
          {loading ? (
            <div className="therapist-dashboard-loading">
              <Loader className="therapist-dashboard-loading-icon" />
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              <StatCard title="Total Students" value={stats.totalStudents} Icon={Users} color="purple" />
              <StatCard title="Total Sessions" value={stats.totalSessions} Icon={GameController2} color="green" />
              <StatCard title="Active Assignments" value={stats.activeAssignments} Icon={Calendar} color="blue" />
              <StatCard title="Avg Performance" value={`${stats.avgPerformance}%`} Icon={TrendingUp} color="orange" />
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="therapist-dashboard-tabs">
          <div className="therapist-dashboard-tabs-nav">
            <nav className="therapist-dashboard-tabs-list">
              {tabs.map(({ path, icon: Icon, label }) => (
                <NavLink
                  to={`/dashboard/therapist/${path}`}
                  key={path}
                  className={({ isActive }) =>
                    `therapist-dashboard-tab${isActive ? ' therapist-dashboard-tab-active' : ''}`
                  }
                >
                  <Icon className="therapist-dashboard-tab-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <Outlet />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, Icon, color }) => {
  return (
    <div className={`therapist-dashboard-stat-card therapist-dashboard-stat-card-${color}`}> 
      <div className="therapist-dashboard-stat-card-inner">
        <div>
          <p className="therapist-dashboard-stat-title">{title}</p>
          <p className="therapist-dashboard-stat-value">{value}</p>
        </div>
        <div className={`therapist-dashboard-stat-icon therapist-dashboard-stat-icon-${color}`}>
          <Icon className="therapist-dashboard-stat-icon-svg" />
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;