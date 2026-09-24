import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Optional if logging in via Google OAuth only
    },
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    googleTokens: {
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
      scope: String,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
