import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmotionWebcam from './EmotionWebcam';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import './MathChallengeGame.css';

const QUESTIONS_URL = '/data/mathQuestions.json';
const TOTAL_QUESTIONS = 5;

function getRandomQuestion(pool, usedIndices) {
  const availableIndices = pool.map((_, idx) => idx).filter(idx => !usedIndices.includes(idx));
  if (availableIndices.length === 0) return null;
  const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  return { question: pool[randomIdx], idx: randomIdx };
}

function getMostFrequentEmotion(emotions) {
  if (!emotions.length) return 'neutral';
  const freq = {};
  emotions.forEach(e => { freq[e] = (freq[e] || 0) + 1; });
  return Object.entries(freq).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}

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

const MathChallengeGame = () => {
  const { user, savePerformance } = useAuth();
  const { completeAssignment } = useGame();
  const [questions, setQuestions] = useState({ easy: [], medium: [], hard: [] });
  const [currentPool, setCurrentPool] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const emotionHistory = useRef([]);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const location = useLocation();

  // Get assignmentId from route state
  const assignmentId = location.state?.assignmentId;

  // Fetch questions from static JSON
  useEffect(() => {
    fetch(QUESTIONS_URL)
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  // Initialize pool and first question
  useEffect(() => {
    if (questions.medium.length > 0 && currentPool.length === 0) {
      setCurrentPool([...questions.medium]);
      setUsedIndices([]);
      const { question: firstQ, idx } = getRandomQuestion(questions.medium, []);
      setQuestion(firstQ);
      setUsedIndices([idx]);
      setShowFeedback(false);
      setStartTime(Date.now());
      emotionHistory.current = [];
    }
  }, [questions]);

  const handleRestart = () => {
    setCurrentPool([]);
    setUsedIndices([]);
    setQuestion(null);
    setScore(0);
    setIsFinished(false);
    setQuestionNumber(1);
    setAnswer('');
    setFeedback('');
    setShowFeedback(false);
    setIsCorrect(false);
    setSubmitted(false);
    emotionHistory.current = [];
    setStartTime(null);
  };

  const handleEmotionChange = (newEmotion) => {
    emotionHistory.current.push(typeof newEmotion === 'string' ? newEmotion : newEmotion.emotion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question || showFeedback) return;
    
    const correctAnswer = question.a;
    const userAnswer = parseInt(answer);
    const correct = userAnswer === correctAnswer;
    
    setIsCorrect(correct);
    if (correct) {
      setFeedback('✅ Correct!');
      setScore((prev) => Math.min(prev + 1, TOTAL_QUESTIONS));
    } else {
      setFeedback(`❌ Incorrect. The correct answer is: ${correctAnswer}`);
    }
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (questionNumber < TOTAL_QUESTIONS) {
      const lastThree = emotionHistory.current.slice(-3);
      console.log('Last 3 emotions for next question difficulty:', lastThree);
      const level = getLevelFromLastThreeEmotions(emotionHistory.current);
      const pool = questions[level] || [];
      let nextUsedIndices = usedIndices;
      let nextCurrentPool = currentPool;
      
      if (pool !== currentPool) {
        nextCurrentPool = [...pool];
        nextUsedIndices = [];
        setCurrentPool(nextCurrentPool);
        setUsedIndices([]);
      }
      
      const { question: nextQ, idx } = getRandomQuestion(pool, nextUsedIndices.concat());
      if (!nextQ) {
        setIsFinished(true);
        return;
      }
      
      setQuestion(nextQ);
      setUsedIndices(prev => [...prev, idx]);
      setQuestionNumber(qn => qn + 1);
      setAnswer('');
      setFeedback('');
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleGameSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const mostFrequentEmotion = getMostFrequentEmotion(
        emotionHistory.current.map(e => typeof e === 'string' ? e : e.emotion)
      );
      const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      
      // Save performance data
      await savePerformance({
        gameType: 'math',
        score: score,
        maxScore: TOTAL_QUESTIONS,
        accuracy: score / TOTAL_QUESTIONS,
        timeSpent,
        difficulty: getLevelFromLastThreeEmotions(emotionHistory.current),
        emotions: emotionHistory.current.map(e => ({
          emotion: typeof e === 'string' ? e : e.emotion,
          confidence: 0.9,
          timestamp: new Date()
        })),
        emotionalState: mostFrequentEmotion
      });
      
      // Mark assignment as completed
      if (assignmentId) {
        try {
          await completeAssignment(assignmentId);
          console.log('✅ MathChallengeGame: Assignment marked as completed:', assignmentId);
        } catch (assignmentError) {
          console.error('❌ Error completing assignment:', assignmentError);
          // Continue with submission even if assignment completion fails
        }
      } else {
        console.log('⚠️ MathChallengeGame: No assignmentId found');
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

  if (!question) return <div className="loading">Loading questions...</div>;

  return (
    <div className="math-game-container">
      <button 
        onClick={() => navigate('/dashboard/student')} 
        className="back-button"
      >
        ← Back to Dashboard
      </button>
      
      <div className="game-card">
        <h2 className="game-title">Math Challenge</h2>
        
        {!isFinished ? (
          <>
            <div className="question-counter">
              Question {questionNumber} of {TOTAL_QUESTIONS}
            </div>
            
            <div className="question-text">
              {question.q}
            </div>
            
            {!showFeedback ? (
              <form onSubmit={handleSubmit} className="answer-form">
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="answer-input"
                  placeholder="Enter your answer"
                  required
                />
                <button
                  type="submit"
                  className="submit-button"
                >
                  Submit Answer
                </button>
              </form>
            ) : (
              <div className="feedback-container">
                <div className={isCorrect ? 'feedback-correct' : 'feedback-incorrect'}>
                  {feedback}
                </div>
                <button 
                  onClick={handleNext}
                  className="next-button"
                >
                  {questionNumber < TOTAL_QUESTIONS ? 'Next Question' : 'Finish Quiz'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="completion-container">
            <h3 className="completion-title">🎉 Quiz Completed!</h3>
            <div className="score-display">
              Your Score: {score} / 5
            </div>
            
            {!submitted && (
              <div className="action-buttons">
                <button onClick={handleRestart} className="restart-button">
                  Play Again
                </button>
                <button 
                  onClick={handleGameSubmit} 
                  className="submit-result-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Submit Result'}
                </button>
              </div>
            )}
            
            {submitted && (
              <div className="submitted-message">
                ✅ Result submitted to therapist!
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="emotion-webcam-container">
        <EmotionWebcam onEmotionChange={handleEmotionChange} />
      </div>
    </div>
  );
};

export default MathChallengeGame;
