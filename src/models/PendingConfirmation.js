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

export const PendingConfirmation = mongoose.model('PendingConfirmation', pendingConfirmationSchema);
