import React from 'react';
import { Play, Clock } from 'lucide-react';

const GameCard = ({ game, onClick }) => {
  if (!game) return null; // Defensive check to prevent errors

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  return (
    <div onClick={onClick} className="game-card creative-game-card">
      <div className="game-card-header creative-gradient-bg">
        <div className="game-card-icon creative-glow">
          <Play className="w-8 h-8" />
        </div>
        <div className="game-card-badge creative-badge">Adaptive</div>
      </div>
      <div className="game-card-body">
        <h3 className="game-card-title creative-title">{game.name}</h3>
        <p className="game-card-desc creative-desc">{game.description}</p>
        <div className="creative-divider"></div>
        <div className="game-card-footer creative-footer">
          <Clock className="w-4 h-4" />
          <span>{game.estimatedTime} min</span>
        </div>
      </div>
    </div>
  );
};

export default GameCard;