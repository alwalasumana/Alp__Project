import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmotionWebcam from './EmotionWebcam';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './PatternRecognitionGame.css';

const QUESTIONS_URL = 'http://localhost:5000/api/questions/pattern';
const TOTAL_QUESTIONS = 5;

function getRandomQuestion(pool, usedIndices) {
  const availableIndices = pool.map((_, idx) => idx).filter(idx => !usedIndices.includes(idx));
  if (availableIndices.length === 0) return null;
  const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  return { question: pool[randomIdx], idx: randomIdx };
}

const PatternRecognitionGame = () => {
  const { user, savePerformance } = useAuth();
  const { completeAssignment } = useGame();
  const [questions, setQuestions] = useState({ easy: [], medium: [], hard: [] });
  const [currentPool, setCurrentPool] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [pattern, setPattern] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const emotionHistory = useRef([]);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const location = useLocation();
  const assignmentId = location.state?.assignmentId;

  // Load questions from JSON file
  useEffect(() => {
    fetch(QUESTIONS_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load questions');
        }
        return res.json();
      })
      .then(data => {
        setQuestions(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading questions:', error);
        setIsLoading(false);
      });
  }, []);

  // Initialize pool and first pattern
  useEffect(() => {
    if (questions.medium && questions.medium.length > 0 && currentPool.length === 0) {
      setCurrentPool([...questions.medium]);
      setUsedIndices([]);
      const { question: firstQ, idx } = getRandomQuestion(questions.medium, []);
      if (firstQ) {
        setPattern(firstQ);
        setUsedIndices([idx]);
        setFeedback('');
        setShowNext(false);
        setStartTime(Date.now());
        emotionHistory.current = [];
      }
    }
  }, [questions, currentPool.length]);

  const handleEmotionChange = (newEmotion) => {
    emotionHistory.current.push(newEmotion);
  };

  function getLevelFromLastThreeEmotions(emotions) {
    if (emotions.length === 0) return 'medium';
    const lastThree = emotions.slice(-3);
    const freq = {};
    lastThree.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    const mostFrequent = Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    if (mostFrequent === 'happy' || mostFrequent === 'surprised') return 'hard';
    if (['sad', 'fear', 'disgust', 'angry'].includes(mostFrequent)) return 'easy';
    return 'medium';
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pattern || !userAnswer.trim()) return;
    
    const userAnswerNum = parseInt(userAnswer);
    if (userAnswerNum === pattern.answer) {
      setFeedback('✅ Correct! Well done!');
      setScore(s => s + 1);
    } else {
      setFeedback('❌ Incorrect. The correct answer was ' + pattern.answer);
    }
    setShowNext(true);
  };

  const handleNext = () => {
    if (questionNumber < TOTAL_QUESTIONS) {
      // Get the last three emotions
      const lastThree = emotionHistory.current.slice(-3);
      console.log('Last 3 emotions for next question difficulty:', lastThree);

      // Use the last three emotions to determine the next difficulty
      const level = getLevelFromLastThreeEmotions(emotionHistory.current);
      const pool = questions[level] || questions.medium || [];
      let nextUsedIndices = usedIndices;
      let nextCurrentPool = currentPool;

      // If switching pools, reset used indices
      if (pool !== currentPool) {
        nextCurrentPool = [...pool];
        nextUsedIndices = [];
        setCurrentPool(nextCurrentPool);
        setUsedIndices([]);
      }

      const { question: nextQ, idx } = getRandomQuestion(pool, nextUsedIndices.concat());
      if (!nextQ) {
        // If no more questions in this pool, try medium level as fallback
        const mediumPool = questions.medium || [];
        const { question: fallbackQ, idx: fallbackIdx } = getRandomQuestion(mediumPool, []);
        if (!fallbackQ) {
          setIsFinished(true);
          return;
        }
        setPattern(fallbackQ);
        setUsedIndices([fallbackIdx]);
      } else {
        setPattern(nextQ);
        setUsedIndices(prev => [...prev, idx]);
      }

      setQuestionNumber(qn => qn + 1);
      setUserAnswer('');
      setFeedback('');
      setShowNext(false);
      setSubmitted(false);
      // Only clear emotion history AFTER using it for difficulty
      emotionHistory.current = [];
    } else {
      setIsFinished(true);
    }
  };

  // Restart game
  const handleRestart = () => {
    setCurrentPool([]);
    setUsedIndices([]);
    setPattern(null);
    setScore(0);
    setIsFinished(false);
    setQuestionNumber(1);
    setUserAnswer('');
    setFeedback('');
    setSubmitted(false);
    setShowNext(false);
    emotionHistory.current = [];
    setStartTime(null);
  };

  function getMostFrequentEmotion(emotions) {
    if (!emotions.length) return 'neutral';
    const freq = {};
    emotions.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
    return Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  // Complete game submission with performance saving
  const handleGameSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const mostFrequentEmotion = getMostFrequentEmotion(emotionHistory.current);
      const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      // Only save to performances collection
      await savePerformance({
        gameType: 'pattern',
        score: score,
        maxScore: TOTAL_QUESTIONS,
        accuracy: score / TOTAL_QUESTIONS,
        timeSpent,
        difficulty: getLevelFromLastThreeEmotions(emotionHistory.current),
        emotions: emotionHistory.current.map(e => ({ 
          emotion: e, 
          confidence: 0.9, 
          timestamp: new Date() 
        })),
        emotionalState: mostFrequentEmotion
      });
      if (assignmentId) {
        await completeAssignment(assignmentId);
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

  if (isLoading) {
    return (
      <div className="pattern-game-container">
        <div className="pattern-loading">
          <div className="loading-spinner"></div>
          <p>Loading pattern recognition game...</p>
        </div>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="pattern-game-container">
        <div className="pattern-loading">
          <p>No patterns available. Please try again later.</p>
          <button 
            onClick={() => navigate('/dashboard/student')} 
            className="pattern-back-button"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pattern-game-container">
      <div className="pattern-game-card">
        <h2 className="pattern-game-title">Pattern Recognition Game</h2>
        {!isFinished ? (
          <>
            <div className="pattern-display">
              <h3>Find the next number in the pattern:</h3>
              <div className="pattern-numbers">
                {pattern.pattern.map((num, index) => (
                  <span key={index} className="pattern-number">{num}</span>
                ))}
                <span className="pattern-question-mark">?</span>
              </div>
            </div>
            <div className="pattern-moves">
              Question {questionNumber} of {TOTAL_QUESTIONS}
            </div>
            <form onSubmit={handleSubmit} className="pattern-answer-form">
              <input
                type="number"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                className="pattern-answer-input"
                placeholder="Enter the next number"
                required
                disabled={showNext}
                autoFocus
              />
              <button 
                type="submit" 
                className="pattern-submit-button" 
                disabled={showNext || !userAnswer.trim()}
              >
                Submit Answer
              </button>
            </form>
            {showNext && (
              <button className="pattern-next-button" onClick={handleNext}>
                {questionNumber < TOTAL_QUESTIONS ? 'Next Question' : 'Finish Quiz'}
              </button>
            )}
          </>
        ) : (
          <>
            <h3 className="pattern-end-message">🎉 Quiz Completed!</h3>
            <div className="score-display">
              <h4>Your Score: {score} / 5</h4>
            </div>
            {!submitted && (
              <div className="pattern-end-buttons">
                <button onClick={handleRestart} className="pattern-restart-button">
                  Play Again
                </button>
                <button 
                  onClick={handleGameSubmit} 
                  className="pattern-submit-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Submit Result'}
                </button>
              </div>
            )}
            {submitted && (
              <div className="pattern-end-message">
                ✅ Result submitted to therapist!
              </div>
            )}
          </>
        )}
        {feedback && (
          <div className={`pattern-feedback ${feedback.includes('✅') ? 'correct' : 'incorrect'}`}>
            {feedback}
          </div>
        )}
      </div>
      <button 
        onClick={() => navigate('/dashboard/student')} 
        className="pattern-back-button"
      >
        ← Back to Dashboard
      </button>
      <div className="emotion-webcam-container">
        <EmotionWebcam onEmotionChange={handleEmotionChange} />
      </div>
    </div>
  );
};

export default PatternRecognitionGame;
