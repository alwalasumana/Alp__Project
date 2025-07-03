require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

// --- Math Questions ---
const mathQuestions = {
  easy: [
    { q: "3 + 6 = ?", a: 9 },
    { q: "7 - 2 = ?", a: 5 },
    { q: "4 + 5 = ?", a: 9 },
    { q: "8 - 3 = ?", a: 5 },
    { q: "2 + 7 = ?", a: 9 }
  ],
  medium: [
    { q: "12 + 34 = ?", a: 46 },
    { q: "56 - 23 = ?", a: 33 },
    { q: "45 + 27 = ?", a: 72 },
    { q: "89 - 54 = ?", a: 35 },
    { q: "67 + 18 = ?", a: 85 }
  ],
  hard: [
    { q: "123 + 456 = ?", a: 579 },
    { q: "789 - 234 = ?", a: 555 },
    { q: "345 + 678 = ?", a: 1023 },
    { q: "912 - 345 = ?", a: 567 },
    { q: "876 + 543 = ?", a: 1419 }
  ]
};

// --- Memory Questions ---
const memoryQuestions = {
  easy: [
    "🐶", "🐱", "🐶", "🐱",
    "🐰", "🐼", "🐰", "🐼"
  ],
  medium: [
    "🍎", "🍌", "🍎", "🍌",
    "🍇", "🍊", "🍇", "🍊"
  ],
  hard: [
    "⚽", "🏀", "⚽", "🏀",
    "🏈", "⚾", "🏈", "⚾"
  ]
};

// --- Pattern Questions ---
const patternQuestions = {
  easy: [
    { pattern: [2, 4, 6, 8], answer: 10, explanation: "Add 2 to each number" },
    { pattern: [1, 3, 5, 7], answer: 9, explanation: "Add 2 to each number" },
    { pattern: [5, 10, 15, 20], answer: 25, explanation: "Add 5 to each number" },
    { pattern: [3, 6, 9, 12], answer: 15, explanation: "Add 3 to each number" },
    { pattern: [10, 20, 30, 40], answer: 50, explanation: "Add 10 to each number" },
    { pattern: [1, 2, 4, 8], answer: 16, explanation: "Multiply by 2 each time" },
    { pattern: [2, 4, 8, 16], answer: 32, explanation: "Multiply by 2 each time" },
    { pattern: [1, 4, 7, 10], answer: 13, explanation: "Add 3 to each number" }
  ],
  medium: [
    { pattern: [1, 2, 4, 7, 11], answer: 16, explanation: "Add 1, then 2, then 3, then 4, then 5" },
    { pattern: [2, 6, 12, 20, 30], answer: 42, explanation: "Add 4, then 6, then 8, then 10, then 12" },
    { pattern: [1, 3, 6, 10, 15], answer: 21, explanation: "Add 2, then 3, then 4, then 5, then 6" },
    { pattern: [3, 7, 13, 21, 31], answer: 43, explanation: "Add 4, then 6, then 8, then 10, then 12" },
    { pattern: [1, 4, 9, 16, 25], answer: 36, explanation: "Square numbers: 1², 2², 3², 4², 5², 6²" },
    { pattern: [2, 5, 10, 17, 26], answer: 37, explanation: "Add 3, then 5, then 7, then 9, then 11" },
    { pattern: [1, 5, 14, 30, 55], answer: 91, explanation: "Add 4, then 9, then 16, then 25, then 36" },
    { pattern: [2, 8, 18, 32, 50], answer: 72, explanation: "Add 6, then 10, then 14, then 18, then 22" }
  ],
  hard: [
    { pattern: [1, 1, 2, 3, 5, 8], answer: 13, explanation: "Fibonacci sequence: each number is the sum of the two preceding ones" },
    { pattern: [2, 3, 5, 7, 11, 13], answer: 17, explanation: "Prime numbers in sequence" },
    { pattern: [1, 2, 6, 24, 120], answer: 720, explanation: "Factorial sequence: multiply by 1, 2, 3, 4, 5, 6" },
    { pattern: [1, 3, 7, 15, 31], answer: 63, explanation: "Multiply by 2 and add 1: 1×2+1=3, 3×2+1=7, etc." },
    { pattern: [2, 6, 12, 20, 30, 42], answer: 56, explanation: "Add 4, then 6, then 8, then 10, then 12, then 14" },
    { pattern: [1, 4, 10, 22, 46], answer: 94, explanation: "Multiply by 2 and add 2: 1×2+2=4, 4×2+2=10, etc." },
    { pattern: [3, 8, 15, 24, 35], answer: 48, explanation: "Add 5, then 7, then 9, then 11, then 13" },
    { pattern: [1, 6, 21, 66, 201], answer: 606, explanation: "Multiply by 3 and add 3: 1×3+3=6, 6×3+3=21, etc." }
  ]
};

// --- Helper to flatten questions ---
function flattenQuestions(type, obj) {
  return Object.entries(obj).flatMap(([difficulty, arr]) =>
    arr.map(data => ({ type, difficulty, data }))
  );
}

const allQuestions = [
  ...flattenQuestions('math', mathQuestions),
  ...flattenQuestions('memory', memoryQuestions),
  ...flattenQuestions('pattern', patternQuestions)
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alp_project';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    await Question.deleteMany({});
    await Question.insertMany(allQuestions);
    console.log('✅ All questions seeded!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error seeding questions:', err);
    mongoose.disconnect();
  }); 