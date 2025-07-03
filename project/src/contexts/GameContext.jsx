import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

const games = [
  {
    id: 'math-challenge',
    name: 'Math Challenge',
    description: 'Solve mathematical problems with adaptive difficulty based on your emotional state.',
    difficulty: 'Adaptive',
    estimatedTime: 10,
    color: 'blue'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Match pairs of cards while the game adapts to your emotional responses.',
    difficulty: 'Adaptive',
    estimatedTime: 8,
    color: 'green'
  },
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identify patterns in sequences with real-time difficulty adjustment.',
    difficulty: 'Adaptive',
    estimatedTime: 12,
    color: 'purple'
  }
];

export const GameProvider = ({ children }) => {
  const [gameSessions, setGameSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const addGameSession = async (session) => {
    try {
      // Save to MongoDB
      const response = await axios.post('http://localhost:5000/api/game-sessions', session, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Update local state
        setGameSessions(prev => [...prev, response.data.session]);
        return response.data.session;
      }
    } catch (error) {
      console.error('Error saving game session:', error);
      // Still update local state as fallback
      setGameSessions(prev => [...prev, { ...session, id: `session-${Date.now()}` }]);
    }
  };

  const assignGame = async (assignment) => {
    try {
      const res = await axios.post('http://localhost:5000/api/assignments', assignment);
      if (res.data.success) {
        setAssignments(prev => [...prev, res.data.assignment]);
        return res.data.assignment;
      }
    } catch (err) {
      console.error('Error assigning game:', err);
      throw err;
    }
  };

  const getStudentAssignments = async (studentId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/assignments/${studentId}`);
      if (res.data.success) {
        setAssignments(res.data.assignments);
        return res.data.assignments;
      }
      return [];
    } catch (err) {
      console.error('Error fetching assignments:', err);
      return [];
    }
  };

  const getAllAssignments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/assignments');
      if (res.data.success) {
        setAssignments(res.data.assignments);
        return res.data.assignments;
      }
      return [];
    } catch (err) {
      console.error('Error fetching all assignments:', err);
      return [];
    }
  };

  const getGameById = (gameId) => {
    return games.find(game => game.id === gameId);
  };

  const completeAssignment = async (assignmentId) => {
    try {
      console.log('🔵 completeAssignment called with ID:', assignmentId);
      const response = await axios.patch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        status: 'completed'
      });
      console.log('✅ Assignment completed successfully:', response.data);
      
      // Update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment._id === assignmentId || assignment.id === assignmentId
            ? { ...assignment, status: 'completed' }
            : assignment
        )
      );
      
      return response.data;
    } catch (err) {
      console.error('❌ Error marking assignment as completed:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      throw err;
    }
  };

  const value = {
    games,
    gameSessions,
    assignments,
    assignGame,
    getStudentAssignments,
    getAllAssignments,
    getGameById,
    completeAssignment
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
