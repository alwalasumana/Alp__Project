const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'assigned' }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
