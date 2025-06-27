// const mongoose = require('mongoose');

// const assignmentSchema = new mongoose.Schema({
//   studentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   gameId: {
//     type: String,
//     enum: ['memory-match', 'math-challenge', 'pattern-recognition'],
//     required: true
//   },
//   assignedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['assigned', 'in-progress', 'completed'],
//     default: 'assigned'
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   assignedAt: {
//     type: Date,
//     default: Date.now
//   },
//   completedAt: {
//     type: Date,
//     default: null
//   }
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// assignmentSchema.index({ studentId: 1, status: 1 });
// assignmentSchema.index({ assignedBy: 1 });

// module.exports = mongoose.model('Assignment', assignmentSchema); 