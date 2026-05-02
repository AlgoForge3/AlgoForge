const express = require('express');
const router  = express.Router();
const AssessmentQuestion = require('../models/AssessmentQuestion');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── In-memory session store for active assessments ────────────────────────────
// Key: userId, Value: { currentDifficulty, questionsAsked[], answers[], consecutiveWrong, difficultyHistory[] }
const sessions = new Map();

const TOTAL_QUESTIONS = 5;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * Pick a random question of given difficulty that hasn't been asked yet in this session.
 */
async function pickQuestion(difficulty, askedIds) {
  const query = {
    difficulty,
    ...(askedIds.length > 0 && { _id: { $nin: askedIds } }),
  };

  const count = await AssessmentQuestion.countDocuments(query);
  if (count === 0) {
    // Fallback: try any question not yet asked
    const fallback = await AssessmentQuestion.findOne({ _id: { $nin: askedIds } });
    return fallback;
  }

  const randomIndex = Math.floor(Math.random() * count);
  const question = await AssessmentQuestion.findOne(query).skip(randomIndex);
  return question;
}

/**
 * Determine the next difficulty based on the adaptive algorithm.
 *
 * Rules:
 *   ✅ Correct → go up one level (Medium → Hard)
 *   ❌ Wrong   → stay same level  
 *   ❌❌ Two consecutive wrong → drop one level (Medium → Easy)
 */
function getNextDifficulty(currentDifficulty, wasCorrect, consecutiveWrong) {
  const idx = DIFFICULTIES.indexOf(currentDifficulty);

  if (wasCorrect) {
    // Go harder (cap at Hard)
    return DIFFICULTIES[Math.min(idx + 1, DIFFICULTIES.length - 1)];
  }

  // Wrong
  if (consecutiveWrong >= 2) {
    // Drop down (floor at Easy)
    return DIFFICULTIES[Math.max(idx - 1, 0)];
  }

  // Stay same
  return currentDifficulty;
}

/**
 * Compute final level from the entire answer history.
 *
 * 5-tier system:
 *   Novice       — failed Easy or got nothing right
 *   Beginner     — passed Easy but failed Medium
 *   Intermediate — passed ≥50% Medium but didn't reach Hard or failed Hard
 *   Advanced     — passed some Hard (≥50%)
 *   Expert       — aced Hard (100%) with strong overall score
 */
function computeFinalLevel(answers) {
  const byDifficulty = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };

  for (const a of answers) {
    byDifficulty[a.difficulty].total++;
    if (a.correct) byDifficulty[a.difficulty].correct++;
  }

  const totalCorrect = answers.filter(a => a.correct).length;
  const easyRate   = byDifficulty.Easy.total   > 0 ? byDifficulty.Easy.correct   / byDifficulty.Easy.total   : 0;
  const mediumRate = byDifficulty.Medium.total > 0 ? byDifficulty.Medium.correct / byDifficulty.Medium.total : 0;
  const hardRate   = byDifficulty.Hard.total   > 0 ? byDifficulty.Hard.correct   / byDifficulty.Hard.total   : 0;

  // Expert: answered Hard questions AND got all of them right + overall score ≥ 80%
  if (byDifficulty.Hard.total > 0 && hardRate >= 1.0 && totalCorrect / answers.length >= 0.8) {
    return 'Expert';
  }
  // Advanced: got ≥50% on Hard questions
  if (byDifficulty.Hard.total > 0 && hardRate >= 0.5) {
    return 'Advanced';
  }
  // Intermediate: got ≥50% on Medium questions
  if (byDifficulty.Medium.total > 0 && mediumRate >= 0.5) {
    return 'Intermediate';
  }
  // Beginner: got at least something right on Easy
  if (byDifficulty.Easy.total > 0 && easyRate > 0) {
    return 'Beginner';
  }
  // Novice: got nothing right or failed everything
  return 'Novice';
}

/**
 * Format a question for the frontend (strip out correctAnswer).
 */
function formatQuestion(q, questionNumber) {
  return {
    _id:        q._id,
    question:   q.question,
    options:    q.options,
    difficulty: q.difficulty,
    topic:      q.topic,
    qNumber:    questionNumber,
    totalQuestions: TOTAL_QUESTIONS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/assessment/start
// Start a new adaptive assessment. Returns the first question (Medium).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Pick first question — always Medium
    const firstQ = await pickQuestion('Medium', []);

    if (!firstQ) {
      return res.status(500).json({ error: 'No assessment questions found. Run the seed script.' });
    }

    // Create session
    sessions.set(userId, {
      currentDifficulty: 'Medium',
      questionsAsked: [firstQ._id],
      answers: [],
      consecutiveWrong: 0,
      difficultyHistory: ['Medium'],
    });

    return res.json({
      question: formatQuestion(firstQ, 1),
      message: 'Assessment started. Good luck!',
    });
  } catch (err) {
    console.error('Assessment start error:', err);
    return res.status(500).json({ error: 'Failed to start assessment.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/assessment/answer
// Submit an answer, get feedback + next question (or final result).
// Body: { questionId, selectedAnswer }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/answer', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { questionId, selectedAnswer } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({ error: 'questionId and selectedAnswer are required.' });
    }

    const session = sessions.get(userId);
    if (!session) {
      return res.status(400).json({ error: 'No active assessment. Call /start first.' });
    }

    // Fetch the question to check answer
    const question = await AssessmentQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;

    // Record answer
    session.answers.push({
      questionId,
      difficulty: question.difficulty,
      correct: isCorrect,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
    });

    // Update consecutive wrong counter
    if (isCorrect) {
      session.consecutiveWrong = 0;
    } else {
      session.consecutiveWrong++;
    }

    const answeredCount = session.answers.length;

    // ── Is this the last question? ──────────────────────────────────────
    if (answeredCount >= TOTAL_QUESTIONS) {
      const finalLevel = computeFinalLevel(session.answers);
      const score      = session.answers.filter(a => a.correct).length;

      // Build breakdown
      const breakdown = {};
      for (const d of DIFFICULTIES) {
        const dAnswers = session.answers.filter(a => a.difficulty === d);
        breakdown[d] = {
          correct: dAnswers.filter(a => a.correct).length,
          total: dAnswers.length,
        };
      }

      // Save to DB
      await User.findByIdAndUpdate(req.user._id, {
        currentLevel: finalLevel,
        assessmentScore: score,
        assessmentCompleted: true,
      });

      // Clean up session
      sessions.delete(userId);

      return res.json({
        finished: true,
        lastAnswer: {
          correct: isCorrect,
          correctAnswer: question.correctAnswer,
        },
        result: {
          finalLevel,
          score,
          totalQuestions: TOTAL_QUESTIONS,
          breakdown,
          difficultyHistory: session.difficultyHistory,
        },
      });
    }

    // ── Not done yet — pick next question ──────────────────────────────
    const nextDifficulty = getNextDifficulty(
      session.currentDifficulty,
      isCorrect,
      session.consecutiveWrong
    );

    session.currentDifficulty = nextDifficulty;
    session.difficultyHistory.push(nextDifficulty);

    const nextQ = await pickQuestion(nextDifficulty, session.questionsAsked);

    if (!nextQ) {
      // Edge case: ran out of questions — finish early
      const finalLevel = computeFinalLevel(session.answers);
      const score      = session.answers.filter(a => a.correct).length;
      sessions.delete(userId);

      return res.json({
        finished: true,
        lastAnswer: { correct: isCorrect, correctAnswer: question.correctAnswer },
        result: { finalLevel, score, totalQuestions: answeredCount, breakdown: {}, difficultyHistory: session.difficultyHistory },
      });
    }

    session.questionsAsked.push(nextQ._id);

    return res.json({
      finished: false,
      lastAnswer: {
        correct: isCorrect,
        correctAnswer: question.correctAnswer,
      },
      nextQuestion: formatQuestion(nextQ, answeredCount + 1),
      currentLevel: nextDifficulty,
    });
  } catch (err) {
    console.error('Assessment answer error:', err);
    return res.status(500).json({ error: 'Failed to process answer.' });
  }
});

module.exports = router;
