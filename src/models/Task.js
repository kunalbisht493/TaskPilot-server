import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for single-user dev mode
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: automatically remove completed tasks 30 days after completion (30 * 24 * 60 * 60 seconds)
taskSchema.index(
  { completedAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: 'completed' } 
  }
);

export const Task = mongoose.model('Task', taskSchema);
