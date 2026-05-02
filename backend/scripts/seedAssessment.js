require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AssessmentQuestion = require('../models/AssessmentQuestion');

const questions = [
  // ── EASY (5) ──────────────────────────────────────────────────────────────────
  {
    question: 'Which data structure follows the First-In-First-Out (FIFO) principle?',
    options: ['Stack', 'Queue', 'Tree', 'Graph'],
    correctAnswer: 'Queue',
    difficulty: 'Easy',
    topic: 'Data Structures',
  },
  {
    question: 'What is the time complexity of accessing an element in an array by its index?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
    correctAnswer: 'O(1)',
    difficulty: 'Easy',
    topic: 'Arrays',
  },
  {
    question: 'Which sorting algorithm repeatedly compares adjacent elements and swaps them?',
    options: ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Heap Sort'],
    correctAnswer: 'Bubble Sort',
    difficulty: 'Easy',
    topic: 'Sorting',
  },
  {
    question: "What does a Stack's pop() operation do?",
    options: ['Adds an element at the top', 'Removes the bottom element', 'Removes and returns the top element', 'Returns the top element without removing'],
    correctAnswer: 'Removes and returns the top element',
    difficulty: 'Easy',
    topic: 'Data Structures',
  },
  {
    question: 'How do you reach the last node in a singly linked list?',
    options: ['Direct index access', 'Traverse from head to end', 'Use binary search', 'Access via the tail pointer always'],
    correctAnswer: 'Traverse from head to end',
    difficulty: 'Easy',
    topic: 'Linked Lists',
  },

  // ── MEDIUM (5) ────────────────────────────────────────────────────────────────
  {
    question: 'What is the time complexity of binary search on a sorted array?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'],
    correctAnswer: 'O(log n)',
    difficulty: 'Medium',
    topic: 'Searching',
  },
  {
    question: 'What is the worst-case time complexity of Quick Sort?',
    options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 'O(n²)',
    difficulty: 'Medium',
    topic: 'Sorting',
  },
  {
    question: 'Which data structure is used for Breadth-First Search (BFS) traversal?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Deque'],
    correctAnswer: 'Queue',
    difficulty: 'Medium',
    topic: 'Graphs',
  },
  {
    question: 'What is the space complexity of Merge Sort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 'O(n)',
    difficulty: 'Medium',
    topic: 'Sorting',
  },
  {
    question: 'In a hash table, what technique resolves collisions by storing multiple elements in the same bucket?',
    options: ['Open Addressing', 'Linear Probing', 'Chaining', 'Double Hashing'],
    correctAnswer: 'Chaining',
    difficulty: 'Medium',
    topic: 'Hash Tables',
  },

  // ── HARD (5) ──────────────────────────────────────────────────────────────────
  {
    question: 'What is the amortized time complexity of inserting an element into a dynamic array (ArrayList)?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    correctAnswer: 'O(1)',
    difficulty: 'Hard',
    topic: 'Amortized Analysis',
  },
  {
    question: 'What is the time complexity of building a max-heap from an unsorted array?',
    options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    correctAnswer: 'O(n)',
    difficulty: 'Hard',
    topic: 'Heaps',
  },
  {
    question: "What is the time complexity of Dijkstra's algorithm using a binary min-heap?",
    options: ['O(V²)', 'O(V + E)', 'O((V + E) log V)', 'O(E log E)'],
    correctAnswer: 'O((V + E) log V)',
    difficulty: 'Hard',
    topic: 'Graphs',
  },
  {
    question: 'What is the recurrence relation for Merge Sort?',
    options: ['T(n) = T(n-1) + O(n)', 'T(n) = 2T(n/2) + O(n)', 'T(n) = T(n/2) + O(1)', 'T(n) = 2T(n-1) + O(1)'],
    correctAnswer: 'T(n) = 2T(n/2) + O(n)',
    difficulty: 'Hard',
    topic: 'Divide and Conquer',
  },
  {
    question: 'A balanced Binary Search Tree guarantees what time complexity for search operations?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    correctAnswer: 'O(log n)',
    difficulty: 'Hard',
    topic: 'Trees',
  },
];

async function seed() {
  await connectDB();
  await AssessmentQuestion.deleteMany({});
  console.log('🗑️   Cleared assessment questions');

  await AssessmentQuestion.insertMany(questions);
  console.log(`🌱  Seeded ${questions.length} assessment questions:`);
  console.log(`     • Easy:   ${questions.filter(q => q.difficulty === 'Easy').length}`);
  console.log(`     • Medium: ${questions.filter(q => q.difficulty === 'Medium').length}`);
  console.log(`     • Hard:   ${questions.filter(q => q.difficulty === 'Hard').length}`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
