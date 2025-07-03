const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'therapist', 'superadmin', 'pending_therapist'],
    required: true
  },
  // Student specific fields
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  level: {
    type: Number,
    default: 1
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  numberOfSubjects: {
    type: Number,
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    interest: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true
    }
  }],
  assignedPath: [{
    subjectName: {
      type: String
    },
    difficulty: {
      type: String
    },
    order: {
      type: Number
    },
    notes: {
      type: String
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 