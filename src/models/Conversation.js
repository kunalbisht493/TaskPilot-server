import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'tool', 'system'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    toolCall: {
      name: String,
      args: mongoose.Schema.Types.Mixed,
    },
    name: String, // For tool observations
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    goal: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'awaiting_confirmation', 'completed', 'failed', 'max_steps_exceeded'],
      default: 'active',
    },
    messages: [messageSchema],
    stepsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
