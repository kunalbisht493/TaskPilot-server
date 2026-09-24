import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { getAuthUrl, getTokensFromCode, getUserProfile } from '../services/googleAuthService.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Cookie options helper for session token
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * GET /api/auth/google
 * Initiates the Google OAuth 2.0 flow
 */
router.get('/google', (req, res) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    return res.status(500).json({
      success: false,
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    });
  }

  const state = req.query.state || '';
  const authUrl = getAuthUrl(state);

  if (req.query.json === 'true') {
    return res.json({ success: true, url: authUrl });
  }

  res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google, persists user, sets JWT cookie, and redirects to client
 */
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(`${config.clientUrl}?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is missing from Google callback.',
      });
    }

    // Exchange authorization code for tokens
    const tokens = await getTokensFromCode(code);

    // Retrieve user identity
    const profile = await getUserProfile(tokens);

    // Find or create user in MongoDB
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = new User({
        name: profile.name || 'User',
        email: profile.email.toLowerCase(),
        avatar: profile.picture,
        googleId: profile.id,
        googleTokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope,
        },
      });
    } else {
      user.googleId = profile.id;
      if (profile.picture) user.avatar = profile.picture;
      if (!user.name && profile.name) user.name = profile.name;

      user.googleTokens = {
        accessToken: tokens.access_token || user.googleTokens?.accessToken,
        refreshToken: tokens.refresh_token || user.googleTokens?.refreshToken,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : user.googleTokens?.tokenExpiry,
        scope: tokens.scope || user.googleTokens?.scope,
      };
    }

    await user.save();

    // Issue JWT session token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.cookie('token', token, getCookieOptions());

    // Redirect back to frontend
    res.redirect(`${config.clientUrl}?auth=success`);
  } catch (err) {
    console.error('[GoogleAuth] Callback error:', err);
    res.redirect(`${config.clientUrl}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and Google connection status
 */
router.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.json({
      authenticated: false,
      user: null,
    });
  }

  const hasGoogleCalendar = Boolean(
    req.user.googleTokens?.refreshToken || req.user.googleTokens?.accessToken
  );

  res.json({
    authenticated: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      hasGoogleCalendar,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * POST /api/auth/dev-login
 * Development helper endpoint: creates or logs in a mock user without Google OAuth
 */
router.post('/dev-login', async (req, res, next) => {
  try {
    const email = (req.body.email || 'developer@taskpilot.local').toLowerCase();
    const name = req.body.name || 'TaskPilot Developer';

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: 'dev_mock_id',
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.cookie('token', token, getCookieOptions());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasGoogleCalendar: Boolean(user.googleTokens?.refreshToken),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
