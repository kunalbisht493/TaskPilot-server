import { z } from 'zod';
import { taskService } from '../services/taskService.js';

export const taskTools = [
  {
    name: 'create_task',
    description:
      'Creates a new to-do task in the internal TaskPilot task database with a title, optional description, priority (low, medium, high), and due date. THIS IS A WRITE ACTION THAT MODIFIES USER STATE AND REQUIRES HUMAN CONFIRMATION BEFORE EXECUTION.',
    isWriteAction: true,
    schema: z.object({
      title: z.string().min(1).describe('The task title, e.g. "Prepare slide deck for client meeting"'),
      description: z
        .string()
        .nullable()
        .optional()
        .describe('Optional details or checklist items for the task'),
      priority: z
        .enum(['low', 'medium', 'high'])
        .nullable()
        .optional()
        .describe('Priority level: "low", "medium", or "high". Defaults to "medium".'),
      dueDate: z
        .string()
        .nullable()
        .optional()
        .describe('Optional ISO date/time string for when the task is due, e.g. "2026-09-26T17:00:00Z"'),
    }),
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title or name of the task to create.',
        },
        description: {
          type: ['string', 'null'],
          description: 'Optional detailed description or notes.',
        },
        priority: {
          type: ['string', 'null'],
          enum: ['low', 'medium', 'high', null],
          description: 'Optional priority: "low", "medium", or "high".',
        },
        dueDate: {
          type: ['string', 'null'],
          description: 'Optional ISO date/time timestamp representing the deadline.',
        },
      },
      required: ['title'],
    },
    execute: async (args, context = {}) => {
      const userId = context.userId || context.user?._id;
      return await taskService.createTask({
        userId,
        title: args.title,
        description: args.description || '',
        priority: args.priority || 'medium',
        dueDate: args.dueDate || null,
      });
    },
  },

  {
    name: 'complete_task',
    description:
      'Marks an existing to-do task as completed in the internal TaskPilot database. Can identify the task by its taskId or by searching for its title/name. THIS IS A WRITE ACTION THAT MUTATES DATABASE STATE AND REQUIRES HUMAN CONFIRMATION BEFORE EXECUTION.',
    isWriteAction: true,
    schema: z.object({
      taskId: z
        .string()
        .nullable()
        .optional()
        .describe('The unique MongoDB ID of the task to mark as completed.'),
      title: z
        .string()
        .nullable()
        .optional()
        .describe('The title or search keyword of the task to complete if taskId is not known.'),
    }),
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: ['string', 'null'],
          description: 'Optional MongoDB ID of the task to complete.',
        },
        title: {
          type: ['string', 'null'],
          description: 'Optional title or keyword of the task to complete if ID is not known.',
        },
      },
      required: [],
    },
    execute: async (args, context = {}) => {
      const userId = context.userId || context.user?._id;
      return await taskService.completeTask({
        userId,
        taskId: args.taskId || null,
        title: args.title || null,
      });
    },
  },

  {
    name: 'list_tasks',
    description:
      'Retrieves the list of to-do tasks from the internal database. Use this to check pending tasks, look up task IDs, or verify active workloads before completing or creating tasks.',
    isWriteAction: false,
    schema: z.object({
      status: z
        .enum(['pending', 'in_progress', 'completed', 'all'])
        .nullable()
        .optional()
        .describe('Filter tasks by status: "pending", "in_progress", "completed", or "all". Defaults to "pending".'),
    }),
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: ['string', 'null'],
          enum: ['pending', 'in_progress', 'completed', 'all', null],
          description: 'Filter tasks by status: "pending", "in_progress", "completed", or "all". Defaults to "pending".',
        },
      },
      required: [],
    },
    execute: async (args, context = {}) => {
      const userId = context.userId || context.user?._id;
      const statusFilter = args.status === 'all' ? 'all' : args.status || 'pending';
      const tasks = await taskService.listTasks({
        userId,
        status: statusFilter,
      });
      return {
        count: tasks.length,
        filter: statusFilter,
        tasks,
      };
    },
  },
];
