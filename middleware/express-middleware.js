const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use node-fetch if needed
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Import models
const User = require('./models/User');
const Performance = require('./models/Performance');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/alp_project', {
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

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('🔵 Registration request received:', req.body);
    
    const { name, email, password, role, therapistId } = req.body;

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

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role
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
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
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
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
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
      resetToken: resetToken, // Remove this in production
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
    const { gameType, score, maxScore, accuracy, timeSpent, difficulty, emotions } = req.body;

    const performance = new Performance({
      studentId: req.user.userId,
      gameType,
      score,
      maxScore,
      accuracy,
      timeSpent,
      difficulty,
      emotions
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
      message: 'Performance saved successfully',
      performance
    });
  } catch (error) {
    console.error('Performance save error:', error);
    res.status(500).json({ error: 'Failed to save performance' });
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

app.get('/', (req, res) => {
  res.send('✅ Emotion Middleware is running with MongoDB!');
});

app.listen(PORT, () => {
  console.log(`✅ Express server running at http://localhost:${PORT}`);
});
