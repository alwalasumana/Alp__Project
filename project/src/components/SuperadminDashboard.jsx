import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TherapistDashboard.css';

const API_BASE = 'http://localhost:5000';

const SuperadminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchPendingTherapists = useCallback(async () => {
    setPendingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/pending-therapists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingTherapists(res.data.pending || []);
    } catch (err) {
      setPendingTherapists([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingTherapists();
  }, [fetchPendingTherapists]);

  const handleApprove = async (id) => {
    const token = localStorage.getItem('token');
    await axios.post(`${API_BASE}/api/approve-therapist`, { userId: id }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPendingTherapists();
  };
  const handleReject = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_BASE}/api/pending-therapist/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPendingTherapists();
  };

  if (!user || user.role !== 'superadmin') {
    return <div style={{ padding: '2em', color: 'red' }}>Access denied.</div>;
  }

  return (
    <div className="therapist-dashboard-bg">
      <div className="therapist-dashboard-header">
        <div className="therapist-dashboard-header-inner">
          <div className="therapist-dashboard-header-left">
            <div className="therapist-dashboard-logo">
              <span style={{ fontWeight: 900, fontSize: 28, color: '#7c3aed' }}>SA</span>
            </div>
            <div>
              <h1 className="therapist-dashboard-title">Superadmin Dashboard</h1>
              <p className="therapist-dashboard-welcome">Welcome, {user?.name}</p>
            </div>
          </div>
          <div className="therapist-dashboard-header-right">
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
        <div className="pending-therapists-approval">
          <h2>Pending Therapist Approvals</h2>
          {pendingLoading ? (
            <p>Loading pending therapists...</p>
          ) : pendingTherapists.length === 0 ? (
            <p>No pending therapist requests.</p>
          ) : (
            <ul>
              {pendingTherapists.map(pt => (
                <li key={pt._id} style={{ display: 'flex', alignItems: 'center', gap: '1.5em', marginBottom: '1em', background: '#f3f4f6', borderRadius: '1em', padding: '1em' }}>
                  <span><b>{pt.name}</b> ({pt.email})</span>
                  <button onClick={() => handleApprove(pt._id)} style={{ background: '#34d399', color: 'white', border: 'none', borderRadius: '0.5em', padding: '0.5em 1.2em', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleReject(pt._id)} style={{ background: '#f87171', color: 'white', border: 'none', borderRadius: '0.5em', padding: '0.5em 1.2em', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard; 