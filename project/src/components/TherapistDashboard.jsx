import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  TowerControl as GameController2,
  BarChart3,
  LogOut,
  Calendar,
  TrendingUp,
  Loader,
  Brain,
} from 'lucide-react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import './TherapistDashboard.css';
import axios from 'axios';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingPathAssignments, setPendingPathAssignments] = useState([]);
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

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
        // Fetch all performances in parallel for speed
        const performanceResults = await Promise.all(
          studentsResult.students.map(student => getPerformance(student._id))
        );
        for (const performanceResult of performanceResults) {
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
  }, [getStudents, getPerformance]);

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
    const load = async () => {
      await fetchDashboardStats();
      setInitialLoading(false);
    };
    load();
  }, [fetchDashboardStats]);

  const checkPendingPathAssignments = async () => {
    try {
      // This would fetch from your notifications or game completion data
      // For now, we'll simulate it
      const students = await getStudents();
      if (students.success) {
        // Check which students have completed games recently
        // and might need path assignments
        console.log('Checking for students who need path assignments...');
      }
    } catch (error) {
      console.error('Error checking pending assignments:', error);
    }
  };

  useEffect(() => {
    checkPendingPathAssignments();
  }, []);

  // Fetch pending therapists if superadmin
  const fetchPendingTherapists = useCallback(async () => {
    if (user?.role !== 'superadmin') return;
    setPendingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pending-therapists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingTherapists(res.data.pending || []);
    } catch (err) {
      setPendingTherapists([]);
    } finally {
      setPendingLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchPendingTherapists();
    }
  }, [user?.role, fetchPendingTherapists]);

  const handleApprove = async (id) => {
    const token = localStorage.getItem('token');
    await axios.post('/api/approve-therapist', { userId: id }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPendingTherapists();
  };
  const handleReject = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`/api/pending-therapist/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPendingTherapists();
  };

  const tabs = [
    { path: 'students', icon: Users, label: 'Students' },
    { path: 'assignments', icon: GameController2, label: 'Game Assignments' },
    { path: 'analytics', icon: BarChart3, label: 'Performance Analytics' },
  ];

  return (
    <div className="therapist-dashboard-bg">
      {/* Superadmin: Pending Therapists Approval */}
      {user?.role === 'superadmin' && (
        <div className="pending-therapists-approval">
          <h2>Pending Therapist Approvals</h2>
          {pendingLoading ? (
            <p>Loading pending therapists...</p>
          ) : pendingTherapists.length === 0 ? (
            <p>No pending therapist requests.</p>
          ) : (
            <ul>
              {pendingTherapists.map(pt => (
                <li key={pt._id} className="pending-therapist-list-item">
                  <span><b>{pt.name}</b> ({pt.email})</span>
                  <button onClick={() => handleApprove(pt._id)} className="pending-therapist-approve-btn">Approve</button>
                  <button onClick={() => handleReject(pt._id)} className="pending-therapist-reject-btn">Reject</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
              className="student-dashboard-refresh therapist-dashboard-refresh-btn"
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
          {initialLoading ? (
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