const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['math', 'memory', 'pattern'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Can be object or string depending on question type
    required: true
  }
});

module.exports = mongoose.model('Question', QuestionSchema); 