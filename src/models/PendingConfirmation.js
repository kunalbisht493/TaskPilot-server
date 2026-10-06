import mongoose from 'mongoose';

const pendingConfirmationSchema = new mongoose.Schema(
  {
    confirmationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// TTL index: automatically delete confirmation records after 14 days
pendingConfirmationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export const PendingConfirmation = mongoose.model('PendingConfirmation', pendingConfirmationSchema);
