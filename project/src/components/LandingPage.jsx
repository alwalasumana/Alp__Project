import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Heart, Star } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 mt-4 tracking-tight">ALP</h1>
        <p className="text-base text-gray-500 mt-1 font-medium tracking-wide">
          Adaptive Learning Path Platform
        </p>
        <p className="text-sm text-gray-400 mt-2 max-w-xs text-center">
          Personalized, emotion-aware learning games for students and therapists.
        </p>
      </div>
      <div className="flex flex-row items-center justify-center gap-6 mb-8">
        <div className="flex flex-col items-center">
          <Heart className="w-7 h-7 text-pink-400 mb-1" />
          <span className="text-xs text-gray-500 font-medium">Emotion-Aware</span>
        </div>
        <div className="flex flex-col items-center">
          <Star className="w-7 h-7 text-yellow-400 mb-1" />
          <span className="text-xs text-gray-500 font-medium">Adaptive Games</span>
        </div>
        <div className="flex flex-col items-center">
          <Brain className="w-7 h-7 text-blue-400 mb-1" />
          <span className="text-xs text-gray-500 font-medium">Therapist Insights</span>
        </div>
      </div>
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-3xl shadow-2xl p-10 flex flex-col items-center w-full max-w-sm">
        <button
          onClick={() => navigate('/login/student')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-md mb-5"
        >
          Student Login
        </button>
        <button
          onClick={() => navigate('/login/therapist')}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-md"
        >
          Therapist Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
