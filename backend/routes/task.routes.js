const express = require('express');
const { body } = require('express-validator');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'inprogress', 'completed']).withMessage('Invalid status'),
];

router.use(protect);

router.route('/').get(getTasks).post(taskRules, validate, createTask);
router.route('/:id').put(updateTask).delete(deleteTask);

module.exports = router;
