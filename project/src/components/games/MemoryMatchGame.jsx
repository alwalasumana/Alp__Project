import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmotionWebcam from './EmotionWebcam';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './MemoryMatchGame.css';

const QUESTIONS_URL = '/data/memoryQuestions.json';

function shuffle(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

const MemoryMatchGame = () => {
  const { user, savePerformance } = useAuth();
  const { addGameSession, completeAssignment } = useGame();
  const location = useLocation();
  const assignmentId = location.state?.assignmentId;
  const [questions, setQuestions] = useState({ easy: [], medium: [], hard: [] });
  const [cards, setCards] = useState([]); // {id, value, isFlipped, isMatched}
  const [flipped, setFlipped] = useState([]); // indices of flipped cards
  const [matched, setMatched] = useState([]); // indices of matched cards
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const emotionHistory = useRef([]);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const NEGATIVE_EMOTIONS = ['sad', 'angry', 'frustrated', 'fear', 'disgust'];
  const NEGATIVE_THRESHOLD = 3;
  const [temporarilyFlippedPair, setTemporarilyFlippedPair] = useState([]);
  const [emotionHistoryLength, setEmotionHistoryLength] = useState(0);

  // Load questions/cards from JSON
  useEffect(() => {
    fetch(QUESTIONS_URL)
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  // Start a new game with shuffled cards based on emotion
  const startNewGame = (level = 'medium') => {
    const base = questions[level] || [];
    const shuffled = shuffle([...base]);
    setCards(
      shuffled.map((val, i) => ({
        id: i,
        value: val,
        isFlipped: false,
        isMatched: false
      }))
    );
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameOver(false);
    setSubmitted(false);
    setStartTime(Date.now());
    emotionHistory.current = [];
  };

  // Start game when questions are loaded
  useEffect(() => {
    if (questions.medium.length > 0 && cards.length === 0) {
      startNewGame('medium');
    }
    // eslint-disable-next-line
  }, [questions]);

  // Handle emotion change for next restart
  const handleEmotionChange = (newEmotion) => {
    setEmotion(newEmotion);
    emotionHistory.current.push(newEmotion);
    setEmotionHistoryLength(emotionHistory.current.length);
    console.log('Emotion history:', emotionHistory.current);
  };

  function getLevelFromEmotions(emotions) {
    const freq = {};
    emotions.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    const mostFrequent = Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    if (mostFrequent === 'happy' || mostFrequent === 'surprised') return 'hard';
    if ([ 'sad', 'fear', 'disgust', 'angry' ].includes(mostFrequent)) return 'easy';
    return 'medium';
  }

  function getMostFrequentEmotion(emotions) {
    if (!emotions.length) return 'neutral';
    const freq = {};
    emotions.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    return Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  // Handle card click
  const handleCardClick = (idx) => {
    if (flipped.length === 2 || cards[idx].isFlipped || cards[idx].isMatched || gameOver) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);
    setCards(cards => cards.map((card, i) => i === idx ? { ...card, isFlipped: true } : card));
  };

  // Check for match and increment moves after every pair
  useEffect(() => {
    if (flipped.length === 2) {
      const [i1, i2] = flipped;
      setTimeout(() => {
        setMoves(m => m + 1);
        if (cards[i1].value === cards[i2].value) {
          setCards(cards => cards.map((card, i) =>
            i === i1 || i === i2 ? { ...card, isMatched: true } : card
          ));
          setMatched(matched => [...matched, i1, i2]);
          setFlipped([]);
        } else {
          setCards(cards => cards.map((card, i) =>
            i === i1 || i === i2 ? { ...card, isFlipped: false } : card
          ));
          setFlipped([]);
        }
      }, 800);
    }
  }, [flipped, cards]);

  // Check for game over
  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      setGameOver(true);
      // Calculate score out of 5
      const scoreValue = Math.round((matched.length / cards.length) * 5);
      setScore(scoreValue);
    }
  }, [matched, cards]);

  // Restart game with new difficulty based on emotion
  const handleRestart = () => {
    const level = getLevelFromEmotions(emotionHistory.current);
    startNewGame(level);
    emotionHistory.current = [];
    setStartTime(Date.now());
  };

  // Complete game submission with performance saving
  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const mostFrequentEmotion = getMostFrequentEmotion(emotionHistory.current);
      const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      await addGameSession({
        studentId: user.id,
        gameId: 'memory-match',
        score: score,
        accuracy: matched.length / (moves * 2),
        timeSpent,
        emotionalState: mostFrequentEmotion,
        completedAt: new Date().toISOString(),
        mistakes: moves - cards.length / 2,
        hintsUsed: 0
      });
      await savePerformance({
        gameType: 'memory',
        score: score,
        maxScore: 5,
        accuracy: matched.length / (moves * 2),
        timeSpent,
        difficulty: getLevelFromEmotions(emotionHistory.current),
        emotions: emotionHistory.current.map(e => ({ 
          emotion: e, 
          confidence: 0.9, 
          timestamp: new Date() 
        })),
        emotionalState: mostFrequentEmotion
      });
      // Mark assignment as completed!
      if (assignmentId) {
        console.log('🔵 MemoryMatchGame: About to complete assignment:', assignmentId);
        await completeAssignment(assignmentId);
        console.log('✅ MemoryMatchGame: Assignment marked as completed:', assignmentId);
      } else {
        console.log('⚠️ MemoryMatchGame: No assignmentId found');
      }
      setSubmitted(true);
      setSaving(false);
      setTimeout(() => {
        navigate('/dashboard/student');
      }, 1500);
    } catch (error) {
      console.error('Error saving game result:', error);
      setSaving(false);
      alert('Failed to save result. Please try again.');
    }
  };

  // Real-time difficulty adjustment: temporarily flip an unmatched pair if last 3 emotions are negative
  useEffect(() => {
    console.log('Checking for negative emotions');
    if (emotionHistory.current.length >= NEGATIVE_THRESHOLD) {
      const lastN = emotionHistory.current.slice(-NEGATIVE_THRESHOLD);
      console.log('Last N emotions:', lastN);
      if (lastN.every(e => NEGATIVE_EMOTIONS.includes(e))) {
        // Find an unmatched, unflipped pair
        const unmatched = cards.filter(card => !card.isMatched && !card.isFlipped);
        if (unmatched.length >= 2) {
          for (let i = 0; i < unmatched.length; i++) {
            for (let j = i + 1; j < unmatched.length; j++) {
              if (unmatched[i].value === unmatched[j].value) {
                setTemporarilyFlippedPair([unmatched[i].id, unmatched[j].id]);
                setTimeout(() => setTemporarilyFlippedPair([]), 2000);
                console.log('Flipping pair:', unmatched[i].id, unmatched[j].id);
                return;
              }
            }
          }
        }
      }
    }
  }, [emotionHistoryLength, cards]);

  if (cards.length === 0) return <div>Loading cards...</div>;

  return (
    <div className="memory-game-container">
      <div className="memory-game-card">
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Memory Match Game</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 60px)', gridTemplateRows: 'repeat(2, 60px)', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
          {cards.map((card, idx) => {
            const isTempFlipped = temporarilyFlippedPair.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                style={{
                  width: 60,
                  height: 60,
                  background: card.isMatched ? '#a7f3d0' : (card.isFlipped || isTempFlipped) ? '#fff' : '#6366f1',
                  color: card.isMatched ? '#fff' : (card.isFlipped || isTempFlipped) ? '#6366f1' : '#fff',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  cursor: card.isFlipped || card.isMatched || gameOver ? 'default' : 'pointer',
                  border: (card.isFlipped || isTempFlipped) ? '2px solid #6366f1' : '2px solid #e0e7ff',
                  transition: 'all 0.3s',
                  userSelect: 'none',
                  outline: isTempFlipped ? '3px solid #fbbf24' : undefined,
                  outlineOffset: isTempFlipped ? '2px' : undefined,
                }}
              >
                {(card.isFlipped || card.isMatched || isTempFlipped) ? card.value : '❓'}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 16, fontWeight: 500 }}>
          Moves: {moves}
        </div>
        {gameOver && !submitted && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <h3 style={{ fontSize: 22, color: '#059669', fontWeight: 700, marginBottom: 12 }}>🎉 Game Completed!</h3>
            <p style={{ marginBottom: 16 }}>You matched all pairs in {moves} moves.</p>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Score: {score} / 5</div>
            <button onClick={handleRestart} style={{ padding: '10px 24px', background: '#6366f1', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 16, marginRight: 12 }}>Restart</button>
            <button 
              onClick={handleSubmit} 
              style={{ padding: '10px 24px', background: '#059669', color: 'white', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 16 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Submit'}
            </button>
          </div>
        )}
        {submitted && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#059669', fontWeight: 600, fontSize: 18 }}>
            Result submitted to therapist!
          </div>
        )}
        {gameOver && !submitted && (
          <div className="memory-end-buttons">
            {/* Play Again button removed as requested */}
          </div>
        )}
      </div>
      <button 
        onClick={() => navigate('/dashboard/student')} 
        className="memory-back-button"
      >
        ← Back to Dashboard
      </button>
      <div className="emotion-webcam-container">
        <EmotionWebcam onEmotionChange={handleEmotionChange} />
      </div>
    </div>
  );
};

export default MemoryMatchGame;
