const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  gameId: { type: String, required: true },
  assignedBy: { type: String, required: true },
  notes: { type: String },
  assignedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'assigned' }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
