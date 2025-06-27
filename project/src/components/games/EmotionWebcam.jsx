import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import './EmotionWebcam.css';
import { FaceMesh } from '@mediapipe/face_mesh';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmotionWebcam = ({ onEmotionChange }) => {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState('neutral');
  const faceMeshRef = useRef(null);
  const { savePerformance } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!faceMeshRef.current) {
      faceMeshRef.current = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    const processFrame = async () => {
      const video = webcamRef.current?.video;
      if (video && video.readyState === 4) {
        await faceMeshRef.current.send({ image: video });
      }
    };

    faceMeshRef.current.onResults(async (results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        let landmarks = results.multiFaceLandmarks[0].map(lm => [lm.x, lm.y, lm.z]);
        window.lastLandmarks = landmarks;
        if (landmarks.length > 468) {
          console.warn('Received more than 468 landmarks, trimming to 468.');
          landmarks = landmarks.slice(0, 468);
        }
        if (landmarks.length === 468) {
          console.log('Sending landmarks:', landmarks.length, landmarks[0]);
          try {
            const response = await fetch('http://localhost:5000/api/emotion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ landmarks })
            });
            const data = await response.json();
            console.log('Backend response:', data);
            if (data && data.emotion) {
              setEmotion(data.emotion);
              if (onEmotionChange) onEmotionChange(data.emotion);
            }
          } catch (err) {
            console.error('Emotion API error:', err);
            setEmotion('neutral');
            if (onEmotionChange) onEmotionChange('neutral');
          }
        } else {
          console.warn('Incorrect number of landmarks after trimming:', landmarks.length);
        }
      } else {
        console.log('No face detected or landmarks missing');
      }
    });

    const interval = setInterval(processFrame, 2000);
    return () => clearInterval(interval);
  }, [onEmotionChange]);

  const handleGameComplete = async (result) => {
    setSaving(true);
    await savePerformance({
      gameType: 'emotion',
      score: result.score,
      maxScore: result.maxScore,
      accuracy: result.accuracy,
      timeSpent: result.timeSpent,
      difficulty: result.difficulty,
      emotions: result.emotions
    });
    setSaving(false);
    navigate('/dashboard/student');
  };

  return (
    <div className="emotion-webcam-container">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        width={120}
        height={90}
        style={{ borderRadius: 8, marginBottom: 8 }}
      />
      <div className="emotion-text">
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </div>
    </div>
  );
};

export default EmotionWebcam;