const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['math', 'memory', 'pattern', 'emotion'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  moves: {
    type: Number
  },
  maxScore: {
    type: Number
  },
  accuracy: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  emotions: [{
    emotion: String,
    confidence: Number,
    timestamp: Date
  }],
  emotionalState: {
    type: String,
    default: 'neutral'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
performanceSchema.index({ studentId: 1, gameType: 1, completedAt: -1 });

module.exports = mongoose.model('Performance', performanceSchema); 