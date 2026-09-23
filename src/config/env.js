import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskpilot',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_taskpilot_default',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // AI Settings
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'groq',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },

  // Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  },

  // Agent Guardrails
  maxReactSteps: parseInt(process.env.MAX_REACT_STEPS || '6', 10),
};
