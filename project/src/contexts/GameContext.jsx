import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

const games = [
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Match pairs of cards to improve memory and concentration',
    category: 'memory',
    difficulty: 'medium',
    icon: 'Brain',
    color: 'bg-purple-500',
    estimatedTime: 10
  },
  {
    id: 'math-challenge',
    name: 'Math Challenge',
    description: 'Solve math problems to build numerical skills',
    category: 'math',
    difficulty: 'easy',
    icon: 'Calculator',
    color: 'bg-green-500',
    estimatedTime: 15
  },
  {
    id: 'pattern-recognition',
    name: 'Pattern Recognition',
    description: 'Identify and complete patterns to enhance logical thinking',
    category: 'pattern',
    difficulty: 'hard',
    icon: 'Puzzle',
    color: 'bg-blue-500',
    estimatedTime: 12
  }
];

export const GameProvider = ({ children }) => {
  const [gameSessions, setGameSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const addGameSession = (session) => {
    setGameSessions(prev => [...prev, { ...session, id: `session-${Date.now()}` }]);
  };

  const assignGame = async (assignment) => {
    try {
      const res = await axios.post('http://localhost:5000/api/assignments', assignment);
      if (res.data.success) {
        setAssignments(prev => [...prev, res.data.assignment]);
      }
    } catch (err) {
      console.error('Error assigning game:', err);
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
      // Optionally update local state
    } catch (err) {
      console.error('❌ Error marking assignment as completed:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
    }
  };

  const value = {
    games,
    gameSessions,
    assignments,
    addGameSession,
    assignGame,
    getStudentAssignments,
    getAllAssignments,
    getGameById,
    completeAssignment
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
