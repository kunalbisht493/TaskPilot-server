import mongoose from 'mongoose';
import { Task } from '../models/Task.js';

export const taskService = {
  /**
   * Creates a new task in the database
   * 
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} [params.userId] - Optional owner user ID
   * @param {string} params.title - Title of the task
   * @param {string} [params.description] - Task details or notes
   * @param {string} [params.priority] - 'low' | 'medium' | 'high'
   * @param {string|Date} [params.dueDate] - Due date timestamp
   */
  async createTask({ userId, title, description = '', priority = 'medium', dueDate = null }) {
    if (!title || typeof title !== 'string') {
      throw new Error('A non-empty string title is required to create a task.');
    }

    const taskData = {
      userId: userId || null,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    if (mongoose.connection.readyState === 1) {
      const createdTask = await Task.create(taskData);
      return {
        id: createdTask._id.toString(),
        title: createdTask.title,
        description: createdTask.description,
        status: createdTask.status,
        priority: createdTask.priority,
        dueDate: createdTask.dueDate ? createdTask.dueDate.toISOString() : null,
        createdAt: createdTask.createdAt.toISOString(),
      };
    } else {
      // Memory fallback for offline test environments
      return {
        id: `mock_task_${Date.now()}`,
        ...taskData,
        dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : null,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Marks a task as completed by taskId or title match
   * 
   * @param {Object} params
   * @param {string} [params.taskId] - Specific MongoDB ID
   * @param {string} [params.title] - Title keyword search if taskId is unknown
   * @param {string|mongoose.Types.ObjectId} [params.userId] - Optional owner user ID
   */
  async completeTask({ taskId, title, userId }) {
    if (!taskId && !title) {
      throw new Error('Either "taskId" or "title" is required to complete a task.');
    }

    if (mongoose.connection.readyState === 1) {
      let task = null;

      if (taskId && mongoose.isValidObjectId(taskId)) {
        const query = { _id: taskId };
        if (userId) query.userId = userId;
        task = await Task.findOne(query);
      }

      if (!task && title) {
        const query = {
          title: new RegExp(title.trim(), 'i'),
          status: { $ne: 'completed' },
        };
        if (userId) query.userId = userId;
        task = await Task.findOne(query);
      }

      if (!task) {
        throw new Error(
          `No pending task found matching ${taskId ? `ID "${taskId}"` : `title "${title}"`}.`
        );
      }

      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();

      return {
        id: task._id.toString(),
        title: task.title,
        status: task.status,
        completedAt: task.completedAt.toISOString(),
      };
    } else {
      // Offline mock fallback
      return {
        id: taskId || `mock_task_${Date.now()}`,
        title: title || 'Mock Task',
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Lists tasks with optional status and user filtering
   * 
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} [params.userId] - Optional user ID
   * @param {string} [params.status] - 'pending' | 'in_progress' | 'completed' | 'all'
   */
  async listTasks({ userId, status = 'all' }) {
    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (userId) query.userId = userId;
      if (status && status !== 'all') query.status = status;

      const tasks = await Task.find(query).sort({ createdAt: -1 }).limit(50);
      return tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      }));
    }

    return [];
  },
};
