const express = require('express');
const router  = express.Router();
const { register, login, googleLogin } = require('../controllers/authController');

// @route  POST /api/auth/register
router.post('/register', register);

// @route  POST /api/auth/login
router.post('/login', login);

// @route  POST /api/auth/google
// @desc   Verify Google ID token, login or auto-register the user
router.post('/google', googleLogin);

module.exports = router;
