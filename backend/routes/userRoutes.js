const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * PATCH /api/user/level
 * @desc   Save assessment result — updates currentLevel, assessmentScore,
 *         and sets assessmentCompleted = true.
 * @access Protected
 */
router.patch('/level', protect, async (req, res) => {
  try {
    const { level, score } = req.body;

    if (!level) {
      return res.status(400).json({ error: '`level` is required.' });
    }

    const allowedLevels = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!allowedLevels.includes(level)) {
      return res.status(400).json({ error: `Invalid level. Must be one of: ${allowedLevels.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        currentLevel:        level,
        assessmentScore:     score ?? null,
        assessmentCompleted: true,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      _id:                 user.id,
      name:                user.name,
      email:               user.email,
      picture:             user.picture || null,
      currentLevel:        user.currentLevel,
      assessmentCompleted: user.assessmentCompleted,
      assessmentScore:     user.assessmentScore,
      authProvider:        user.authProvider || 'local',
    });
  } catch (err) {
    console.error('Update level error:', err);
    return res.status(500).json({ error: 'Failed to update user level.' });
  }
});

const getUserQuery = (req) => {
  const param = req.params.username;
  if (!param) return { _id: req.user._id };
  
  const searchParam = param.toLowerCase();
  
  // Priority logic for specific user routing
  return {
    $or: [
      { username: searchParam },
      // If the URL name matches the logged-in user's name (normalized), use their ID
      { _id: req.user.name.replace(/\s+/g, '').toLowerCase() === searchParam ? req.user._id : null },
      // Fallback to fuzzy name match
      { name: { $regex: new RegExp(`^${param.split('').join('\\s*')}$`, 'i') } }
    ].filter(q => q && Object.values(q)[0] !== null)
  };
};

/**
 * GET /api/user/profile
 * @desc   Get current user's profile (for refreshing state on load)
 * @access Protected
 */
router.get(['/profile', '/profile/:username'], protect, async (req, res) => {
  try {
    const userQuery = getUserQuery(req);
      
    const user = await User.findOne(userQuery).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Auto-heal missing usernames in the background
    if (!user.username) {
        const { generateUniqueUsername } = require('../controllers/authController');
        generateUniqueUsername(user.email, user.name).then(async (newUsername) => {
            await User.findByIdAndUpdate(user._id, { username: newUsername });
        }).catch(err => console.error("Auto-heal username failed:", err));
    }

    return res.json({
      _id:                 user.id,
      name:                user.name,
      email:               user.email,
      picture:             user.picture || null,
      currentLevel:        user.currentLevel,
      assessmentCompleted: user.assessmentCompleted,
      assessmentScore:     user.assessmentScore,
      authProvider:        user.authProvider || 'local',
      solvedProblems:      user.solvedProblems,
      bio:                 user.bio || '',
      location:            user.location || '',
      website:             user.website || '',
      github:              user.github || '',
      linkedin:            user.linkedin || '',
      createdAt:           user.createdAt,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

/**
 * GET /api/user/stats
 * @desc   Get user stats — solved count, topic mastery, accuracy
 * @access Protected
 */
router.get(['/stats', '/stats/:username'], protect, async (req, res) => {
  const Problem    = require('../models/Problem');
  const Submission = require('../models/Submission');

  try {
    const userQuery = getUserQuery(req);
      
    const user = await User.findOne(userQuery)
      .select('solvedProblems currentLevel _id')
      .populate('solvedProblems', 'topics difficulty');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const solvedCount = user.solvedProblems.length;

    // ── Topic Mastery ────────────────────────────────────────────────────
    // Get total problems per topic
    const allProblems = await Problem.find({}).select('topics').lean();
    const topicTotals = {};
    const topicSolved = {};

    for (const p of allProblems) {
      for (const t of (p.topics || [])) {
        topicTotals[t] = (topicTotals[t] || 0) + 1;
        topicSolved[t] = topicSolved[t] || 0;
      }
    }

    for (const sp of user.solvedProblems) {
      for (const t of (sp.topics || [])) {
        topicSolved[t] = (topicSolved[t] || 0) + 1;
      }
    }

    const topicMastery = Object.keys(topicTotals).map(topic => ({
      topic,
      solved: topicSolved[topic] || 0,
      total:  topicTotals[topic],
      pct:    Math.round(((topicSolved[topic] || 0) / topicTotals[topic]) * 100),
    }));

    // ── Accuracy (from submissions) ── only count latest per problem ──
    const totalSubmissions = await Submission.countDocuments({ userId: user._id });
    const acceptedSubmissions = await Submission.countDocuments({ userId: user._id, status: 'Accepted' });
    const accuracy = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

    return res.json({
      solvedCount,
      totalProblems: allProblems.length,
      accuracy,
      currentLevel: user.currentLevel,
      topicMastery,
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

/**
 * PATCH /api/user/profile
 * @desc   Edit user profile (bio, location, website, github, linkedin, name)
 * @access Protected
 */
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, bio, location, website, github, linkedin } = req.body;

    const updateFields = {};
    if (name !== undefined)     updateFields.name     = name.trim().slice(0, 50);
    if (bio !== undefined)      updateFields.bio      = bio.trim().slice(0, 300);
    if (location !== undefined) updateFields.location  = location.trim().slice(0, 100);
    if (website !== undefined)  updateFields.website   = website.trim().slice(0, 200);
    if (github !== undefined)   updateFields.github    = github.trim().slice(0, 100);
    if (linkedin !== undefined) updateFields.linkedin  = linkedin.trim().slice(0, 200);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      _id: user.id, name: user.name, email: user.email,
      picture: user.picture || null, currentLevel: user.currentLevel,
      assessmentCompleted: user.assessmentCompleted,
      assessmentScore: user.assessmentScore,
      bio: user.bio, location: user.location,
      website: user.website, github: user.github, linkedin: user.linkedin,
      authProvider: user.authProvider || 'local',
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * GET /api/user/heatmap
 * @desc   Get submission activity for heatmap (last 365 days, daily counts)
 * @access Protected
 */
router.get(['/heatmap', '/heatmap/:username'], protect, async (req, res) => {
  const Submission = require('../models/Submission');

  try {
    const userQuery = getUserQuery(req);
    const user = await User.findOne(userQuery);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const submissions = await Submission.aggregate([
      {
        $match: {
          userId: user._id,
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Convert to { "2025-04-24": 3, "2025-04-25": 1, ... }
    const heatmap = {};
    for (const s of submissions) {
      heatmap[s._id] = s.count;
    }

    // Total submissions + current streak
    const totalSubmissions = await Submission.countDocuments({ userId: user._id });
    const acceptedSubmissions = await Submission.countDocuments({ userId: user._id, status: 'Accepted' });

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = new Date(today); d >= oneYearAgo; d.setDate(d.getDate() - 1)) {
      const key = d.toISOString().slice(0, 10);
      if (heatmap[key]) {
        streak++;
      } else {
        break;
      }
    }

    return res.json({
      heatmap,
      totalSubmissions,
      acceptedSubmissions,
      streak,
    });
  } catch (err) {
    console.error('Heatmap fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch heatmap.' });
  }
});

/**
 * GET /api/user/submissions
 * @desc   Get recent submissions for profile page
 * @access Protected
 */
router.get(['/submissions', '/submissions/:username'], protect, async (req, res) => {
  const Submission = require('../models/Submission');

  try {
    const userQuery = getUserQuery(req);
    const user = await User.findOne(userQuery);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const submissions = await Submission.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('problemId', 'title difficulty problemNumber')
      .lean();

    const formatted = submissions.map(s => ({
      _id: s._id,
      problem: s.problemId ? {
        title: s.problemId.title,
        difficulty: s.problemId.difficulty,
        problemNumber: s.problemId.problemNumber,
      } : { title: `Problem #${s.problemNumber}`, difficulty: 'Easy', problemNumber: s.problemNumber },
      language: s.language,
      status: s.status,
      passedCases: s.passedCases,
      totalCases: s.totalCases,
      executionTime: s.executionTime,
      date: s.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('Submissions fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

module.exports = router;

