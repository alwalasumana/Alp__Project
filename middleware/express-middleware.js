require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Assignment = require('./models/Assignment');
const Question = require('./models/Question');

// Using built-in fetch (available in Node.js 18+)

// Import models
const User = require('./models/User');
const Performance = require('./models/Performance');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alp_project', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Fix: Middleware must be before routes
app.use(cors());
app.use(express.json()); // <== this must come BEFORE your routes

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check superadmin
function requireSuperadmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
}

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('🔵 Registration request received:', req.body);
    
    const { name, email, password, role, therapistId, subjects } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role for therapist
    let finalRole = role;
    if (role === 'therapist') {
      const superadminExists = await User.exists({ role: 'superadmin' });
      if (!superadminExists) {
        finalRole = 'superadmin';
      } else {
        finalRole = 'pending_therapist';
      }
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: finalRole,
      subjects: subjects || []
    };
    if (role === 'student' && therapistId) {
      userData.therapistId = therapistId;
    }

    const user = new User(userData);

    console.log('🔵 Creating user:', { name: user.name, email: user.email, role: user.role, therapistId: user.therapistId });

    await user.save();
    console.log('✅ User saved successfully');

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔵 Login request received:', { email: req.body.email, password: req.body.password ? '***' : 'undefined' });
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔵 User lookup result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block login for pending therapists
    if (user.role === 'pending_therapist') {
      return res.status(403).json({ error: 'Your therapist account is pending approval by the superadmin.' });
    }

    console.log('🔵 Found user:', { name: user.name, email: user.email, role: user.role });

    // Compare password manually
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔵 Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('✅ Login successful for:', user.email);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Forgot password - send reset email (simplified version)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    // Generate a simple reset token (in production, use a more secure method)
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send this token via email
    // For now, we'll return it directly (for demo purposes)
    res.json({
      message: 'Password reset link sent to your email',
      userId: user._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify the reset token
    const decoded = jwt.verify(resetToken, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Performance tracking endpoints
app.post('/api/performance', authenticateToken, async (req, res) => {
  try {
    const { gameType, score, moves, maxScore, accuracy, timeSpent, difficulty, emotions, emotionalState } = req.body;

    const performance = new Performance({
      studentId: req.user.userId,
      gameType,
      score,
      moves,
      maxScore,
      accuracy,
      timeSpent,
      difficulty,
      emotions,
      emotionalState
    });

    await performance.save();

    // Update student's total points and level
    const student = await User.findById(req.user.userId);
    if (student && student.role === 'student') {
      student.totalPoints += score;
      student.level = Math.floor(student.totalPoints / 1000) + 1;
      await student.save();
    }

    res.status(201).json({
      success: true,
      message: 'Performance saved successfully',
      performance
    });
  } catch (error) {
    console.error('Performance save error:', error);
    res.status(500).json({ success: false, error: 'Failed to save performance' });
  }
});

// Get student performance
app.get('/api/performance/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { gameType, limit = 10 } = req.query;

    let query = { studentId };
    if (gameType) {
      query.gameType = gameType;
    }

    const performances = await Performance.find(query)
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));

    res.json({ performances });
  } catch (error) {
    console.error('Performance fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

// Get therapist's students
app.get('/api/therapist/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const students = await User.find({ 
      therapistId: req.user.userId,
      role: 'student'
    }).select('-password');

    res.json({ students });
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all therapists (for student registration)
app.get('/api/therapists', async (req, res) => {
  try {
    const therapists = await User.find({ role: 'therapist' }).select('_id name email');
    res.json({ therapists });
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// ✅ Add safe check for undefined body
app.post('/api/emotion', async (req, res) => {
  const body = req.body;

  // Log the incoming landmarks
  if (!body || !body.landmarks || !Array.isArray(body.landmarks)) {
    console.log('❌ No landmarks received or wrong format');
    return res.status(400).json({ error: 'Expected landmarks in JSON body' });
  }

  const { landmarks } = body;
  console.log('✅ Received landmarks from frontend:', landmarks.length, 'points');

  if (landmarks.length !== 468) {
    console.log('❌ Incorrect number of landmarks:', landmarks.length);
    return res.status(400).json({ error: 'Expected 468 landmarks' });
  }

  try {
    // Log before sending to FastAPI
    console.log('➡️  Forwarding landmarks to FastAPI backend...');
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarks }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ FastAPI backend error:', errorText);
      return res.status(500).json({ error: 'Backend error', details: errorText });
    }

    const data = await response.json();
    // Log the emotion received from FastAPI
    console.log('✅ Emotion from FastAPI:', data.emotion);
    res.json(data);
  } catch (err) {
    console.error('❌ FastAPI request failed:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST: Assign a game
app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET: Get assignments for a student
app.get('/api/assignments/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assignments = await Assignment.find({ studentId })
      .sort({ updatedAt: -1, assignedAt: -1 }); // Most recent first
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// (Optional) GET all assignments for therapist dashboard
app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/assignments/:id', async (req, res) => {
  console.log('🔵 PATCH /api/assignments/:id called');
  console.log('🔵 Assignment ID:', req.params.id);
  console.log('🔵 Request body:', req.body);
  console.log('🔵 Status to update:', req.body.status);
  
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    
    console.log('🔵 Assignment found and updated:', assignment);
    
    if (!assignment) {
      console.log('❌ Assignment not found with ID:', req.params.id);
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    
    console.log('✅ Assignment status updated successfully to:', assignment.status);
    res.json({ success: true, assignment });
  } catch (err) {
    console.error('❌ Error updating assignment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all performances for all students of the therapist
app.get('/api/performances/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'therapist') {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Find all students for this therapist
    const students = await User.find({ therapistId: req.user.userId, role: 'student' }).select('_id name');
    const studentIds = students.map(s => s._id);
    // Fetch all performances for these students
    const performances = await Performance.find({ studentId: { $in: studentIds } })
      .sort({ completedAt: -1 });
    res.json({ students, performances });
  } catch (error) {
    console.error('Performance fetch all error:', error);
    res.status(500).json({ error: 'Failed to fetch all performances' });
  }
});

// Update student subjects
app.put('/api/student/subjects', authenticateToken, async (req, res) => {
  try {
    const { numberOfSubjects, subjects } = req.body;
    const studentId = req.user.userId;
    
    const user = await User.findByIdAndUpdate(
      studentId,
      { 
        numberOfSubjects,
        subjects 
      },
      { new: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign path to student
app.post('/api/student/assign-path', authenticateToken, async (req, res) => {
  try {
    const { studentId, path } = req.body;
    
    const user = await User.findByIdAndUpdate(
      studentId,
      { assignedPath: path },
      { new: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student subjects and path
app.get('/api/student/:studentId/subjects', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.studentId);
    res.json({ 
      success: true, 
      numberOfSubjects: user.numberOfSubjects,
      subjects: user.subjects,
      assignedPath: user.assignedPath 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all pending therapists
app.get('/api/pending-therapists', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const pending = await User.find({ role: 'pending_therapist' }).select('-password');
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending therapists' });
  }
});

// Approve a pending therapist
app.post('/api/approve-therapist', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const user = await User.findById(userId);
    if (!user || user.role !== 'pending_therapist') {
      return res.status(404).json({ error: 'Pending therapist not found' });
    }
    user.role = 'therapist';
    await user.save();
    res.json({ message: 'Therapist approved', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve therapist' });
  }
});

// Reject (delete) a pending therapist
app.delete('/api/pending-therapist/:userId', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user || user.role !== 'pending_therapist') {
      return res.status(404).json({ error: 'Pending therapist not found' });
    }
    await user.deleteOne();
    res.json({ message: 'Pending therapist rejected and deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject therapist' });
  }
});

// GET: Fetch questions by type (math, memory, pattern)
app.get('/api/questions/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['math', 'memory', 'pattern'].includes(type)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }
    const questions = await Question.find({ type });
    // Group by difficulty
    const grouped = { easy: [], medium: [], hard: [] };
    questions.forEach(q => {
      if (grouped[q.difficulty]) grouped[q.difficulty].push(q.data);
    });
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Emotion Middleware is running with MongoDB!');
});

app.listen(PORT, () => {
  console.log(`✅ Express server running at http://localhost:${PORT}`);
});
