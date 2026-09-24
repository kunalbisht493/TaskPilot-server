import { google } from 'googleapis';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Creates a new OAuth2 client instance using application configuration
 */
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
};

/**
 * Generates the Google OAuth 2.0 authorization URL
 * Requests offline access to ensure a refresh token is provided
 */
export const getAuthUrl = (state = '') => {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    include_granted_scopes: true,
    ...(state ? { state } : {}),
  });
};

/**
 * Exchanges authorization code for access and refresh tokens
 */
export const getTokensFromCode = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Retrieves basic profile information using Google OAuth2 Userinfo API
 */
export const getUserProfile = async (tokens) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
};

/**
 * Generates an authenticated OAuth2 client for an existing user.
 * Automatically refreshes the token if expired and attaches event listeners
 * to update the MongoDB user record with fresh access tokens.
 */
export const getAuthenticatedClientForUser = async (user) => {
  if (!user || (!user.googleTokens?.refreshToken && !user.googleTokens?.accessToken)) {
    throw new Error('User does not have Google OAuth credentials configured.');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.googleTokens?.accessToken,
    refresh_token: user.googleTokens?.refreshToken,
    expiry_date: user.googleTokens?.tokenExpiry
      ? new Date(user.googleTokens.tokenExpiry).getTime()
      : undefined,
  });

  // Automatically persist any refreshed tokens issued by Google's client
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      const updates = {};
      if (newTokens.access_token) {
        updates['googleTokens.accessToken'] = newTokens.access_token;
      }
      if (newTokens.refresh_token) {
        updates['googleTokens.refreshToken'] = newTokens.refresh_token;
      }
      if (newTokens.expiry_date) {
        updates['googleTokens.tokenExpiry'] = new Date(newTokens.expiry_date);
      }
      await User.findByIdAndUpdate(user._id, { $set: updates });
    } catch (err) {
      console.error('[GoogleAuthService] Failed to auto-persist refreshed tokens:', err.message);
    }
  });

  return oauth2Client;
};
