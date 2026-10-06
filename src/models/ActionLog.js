import mongoose from 'mongoose';

const actionLogSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    tool: {
      type: String,
      required: true,
    },
    args: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    success: {
      type: Boolean,
      default: true,
    },
    confirmedByUser: {
      type: Boolean,
      default: false,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// TTL index: automatically delete audit logs after 14 days (14 * 24 * 60 * 60 seconds)
actionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export const ActionLog = mongoose.model('ActionLog', actionLogSchema);
