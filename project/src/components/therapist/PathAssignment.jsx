import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './PathAssignment.css';

const GAME_ID_TO_TYPE = {
  'math-challenge': 'math',
  'memory-match': 'memory',
  'pattern-recognition': 'pattern'
};
const GAME_TYPE_TO_ID = {
  'math': 'math-challenge',
  'memory': 'memory-match',
  'pattern': 'pattern-recognition'
};

const PathAssignment = ({ studentId, onPathAssigned }) => {
  const [studentData, setStudentData] = useState(null);
  const [subjectOrders, setSubjectOrders] = useState({});
  const [subjectNotes, setSubjectNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getStudentAssignments, getGameById } = useGame();
  const [latestPerformance, setLatestPerformance] = useState(null);

  useEffect(() => {
    fetchStudentData();
    fetchLatestPerformance();
  }, [studentId]);

  useEffect(() => {
    if (studentData && studentData.subjects) {
      // Initialize orders and notes
      const initialOrders = {};
      const initialNotes = {};
      studentData.subjects.forEach((subj, idx) => {
        initialOrders[subj.name] = '';
        initialNotes[subj.name] = '';
      });
      setSubjectOrders(initialOrders);
      setSubjectNotes(initialNotes);
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/student/${studentId}/subjects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudentData(data);
      }
    } catch (err) {
      setError('Failed to fetch student data');
    }
  };

  const fetchLatestPerformance = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/performance/${studentId}?limit=1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.performances && data.performances.length > 0) {
        setLatestPerformance(data.performances[0]);
      } else {
        setLatestPerformance(null);
      }
    } catch (err) {
      setLatestPerformance(null);
    }
  };

  const handleOrderChange = (subjectName, value) => {
    setSubjectOrders(prev => ({ ...prev, [subjectName]: value.replace(/[^0-9]/g, '') }));
  };

  const handleNoteChange = (subjectName, value) => {
    setSubjectNotes(prev => ({ ...prev, [subjectName]: value }));
  };

  const assignPath = async () => {
    // Build path from subjectOrders and subjectNotes
    const orderedSubjects = studentData.subjects
      .map(subj => ({
        subjectName: subj.name,
        difficulty: subj.difficulty,
        order: parseInt(subjectOrders[subj.name], 10),
        notes: subjectNotes[subj.name] || ''
      }))
      .filter(item => item.order > 0 && !isNaN(item.order))
      .sort((a, b) => a.order - b.order);
    if (orderedSubjects.length === 0) {
      setError('Please assign an order to at least one subject');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/student/assign-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId,
          path: orderedSubjects
        })
      });
      const data = await response.json();
      if (data.success) {
        onPathAssigned && onPathAssigned(orderedSubjects);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to assign path');
    } finally {
      setLoading(false);
    }
  };

  if (!studentData) {
    return <div>Loading student data...</div>;
  }

  return (
    <div className="path-assignment">
      <div className="modal-header">
        <span className="modal-header-icon">🎯</span>
        <span className="modal-header-title">Assign Learning Path</span>
      </div>
      
      {latestPerformance && (
        <div className="latest-assignment-result">
          <h4 style={{ margin: 0, color: '#7c3aed' }}>Latest Game Result</h4>
          <div>Game: <b>{latestPerformance.gameType}</b></div>
          <div>
            {latestPerformance.gameType === 'memory'
              ? <>Moves: <b>{latestPerformance.moves}</b></>
              : <>Score: <b>{latestPerformance.score}</b></>
            }
          </div>
          <div>Status: <b>completed</b></div>
          <div>Date: <b>{latestPerformance.completedAt ? new Date(latestPerformance.completedAt).toLocaleString() : 'N/A'}</b></div>
        </div>
      )}

      <div className="student-subjects">
        <h4>Assign Order to Subjects</h4>
        {studentData.subjects.map((subject, index) => (
          <div key={index} className="subject-item">
            <span>{subject.name}</span>
            <span>Interest: {subject.interest}</span>
            <span>Difficulty: {subject.difficulty}</span>
            <input
              type="number"
              min="1"
              max={studentData.subjects.length}
              value={subjectOrders[subject.name] || ''}
              onChange={e => handleOrderChange(subject.name, e.target.value)}
              placeholder="Order"
              className="subject-order-input"
            />
            <input
              type="text"
              value={subjectNotes[subject.name] || ''}
              onChange={e => handleNoteChange(subject.name, e.target.value)}
              placeholder="Notes (optional)"
              className="subject-notes-input"
            />
          </div>
        ))}
      </div>

      <div className="assigned-path">
        <h4>Preview Path</h4>
        {studentData.subjects
          .map(subj => ({
            subjectName: subj.name,
            difficulty: subj.difficulty,
            order: parseInt(subjectOrders[subj.name], 10),
            notes: subjectNotes[subj.name] || ''
          }))
          .filter(item => item.order > 0 && !isNaN(item.order))
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => (
            <div key={idx} className="path-item">
              <span className="path-badge">{item.order}</span>
              <span>{item.subjectName}</span>
              <span>Difficulty: {item.difficulty}</span>
              {item.notes && <span>Notes: {item.notes}</span>}
            </div>
          ))}
      </div>

      <button
        onClick={assignPath}
        disabled={loading || Object.values(subjectOrders).every(v => !v)}
        className="assign-path-btn"
      >
        {loading ? 'Assigning...' : 'Assign Path'}
      </button>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default PathAssignment;
