import express from 'express';
import { taskService } from '../services/taskService.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { Task } from '../models/Task.js';

const router = express.Router();

/**
 * GET /api/tasks
 * Returns tasks for current user or all tasks
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const userId = req.user?._id;
    const tasks = await taskService.listTasks({ userId, status });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Direct creation of a task
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Field "title" is required.',
      });
    }

    const task = await taskService.createTask({
      userId: req.user?._id,
      title,
      description,
      priority,
      dueDate,
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/complete
 * Marks a task as completed
 */
router.patch('/:id/complete', optionalAuth, async (req, res, next) => {
  try {
    const result = await taskService.completeTask({
      taskId: req.params.id,
      userId: req.user?._id,
    });

    res.json({
      success: true,
      task: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Deletes a task
 */
router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user?._id) query.userId = req.user._id;

    const deleted = await Task.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Task not found.',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
