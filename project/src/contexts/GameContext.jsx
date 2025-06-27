import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Game definitions (these are static and don't need to be removed)
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
  // Initialize with empty arrays instead of mock data
  const [gameSessions, setGameSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const addGameSession = (session) => {
    setGameSessions(prev => [...prev, { ...session, id: `session-${Date.now()}` }]);
  };

  const assignGame = (assignment) => {
    const newAssignment = {
      ...assignment,
      id: `assign-${Date.now()}`,
      assignedAt: new Date().toISOString(),
      status: 'assigned'
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const getStudentSessions = (studentId) => {
    return gameSessions.filter(session => session.studentId === studentId);
  };

  const getStudentAssignments = (studentId) => {
    return assignments.filter(assignment => assignment.studentId === studentId);
  };

  const getGameById = (gameId) => {
    return games.find(game => game.id === gameId);
  };

  const value = {
    games,
    gameSessions,
    assignments,
    addGameSession,
    assignGame,
    getStudentSessions,
    getStudentAssignments,
    getGameById
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};