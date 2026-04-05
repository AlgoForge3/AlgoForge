const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User     = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helper ─────────────────────────────────────────────────────────────────
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const userPayload = (user) => ({
  _id:          user.id,
  name:         user.name,
  email:        user.email,
  picture:      user.picture || null,
  currentLevel: user.currentLevel,
  authProvider: user.authProvider || 'local',
  token:        generateToken(user._id),
});

// ── @desc   Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Please provide all fields.' });
    if (await User.findOne({ email })) return res.status(400).json({ error: 'User already exists.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword });
    return res.status(201).json(userPayload(user));
  } catch (err) {
    res.status(500).json({ error: 'Registration error.' });
  }
};

// ── @desc   Authenticate (login) a user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    res.json(userPayload(user));
  } catch (err) {
    res.status(500).json({ error: 'Login error.' });
  }
};

// ── @desc   Google OAuth Login / Register
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google token is required.' });

    console.log(`[Google Auth] Received token prefix: ${token.substring(0, 10)}... (length: ${token.length})`);

    let payload;
    
    // If token starts with ya29, it's an access token. Use getTokenInfo.
    // If it starts with eyJ, it's an ID token. Use verifyIdToken.
    if (token.startsWith('ya29')) {
      console.log('[Google Auth] Using access token verification flow');
      const tokenInfo = await client.getTokenInfo(token);
      
      // Get additional user info since tokenInfo only has email/sub
      // For a more complete profile, we'd normally use the userinfo endpoint
      // but we'll stick to what we can get or verify.
      payload = {
        email: tokenInfo.email,
        sub: tokenInfo.sub,
        name: tokenInfo.email.split('@')[0], // Fallback name
      };
    } else {
      console.log('[Google Auth] Using ID token verification flow');
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture || user.picture;
        user.authProvider = 'google';
        await user.save();
      }
    } else {
      const randomPassword = require('crypto').randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        googleId,
        picture,
        authProvider: 'google',
      });
    }

    res.json(userPayload(user));
  } catch (err) {
    console.error('[Google Auth Error]', err.message);
    res.status(500).json({ error: 'Server error during Google authentication.' });
  }
};

module.exports = { register, login, googleLogin };
