import React from 'react';
import { Play, Clock, Star } from 'lucide-react';

const GameCard = ({ game, onClick }) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
    >
      <div className={`h-32 ${game.color} flex items-center justify-center relative`}>
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
          <Play className="w-8 h-8 text-white" />
        </div>
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[game.difficulty]}`}>
          {game.difficulty}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{game.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{game.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{game.estimatedTime} min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;