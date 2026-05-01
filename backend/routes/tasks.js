const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

const isMember = (project, userId) =>
  project.members.some(m => m.user.toString() === userId.toString());

const isAdmin = (project, userId) =>
  project.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');

// GET /api/tasks?project=:id - Get tasks by project
router.get('/', auth, async (req, res) => {
  try {
    const { project: projectId, status, priority, assignee } = req.query;
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/my - Get current user's assigned tasks
router.get('/my', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name color')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/dashboard - Dashboard stats for current user
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userProjects = await Project.find({ 'members.user': req.user._id });
    const projectIds = userProjects.map(p => p._id);

    const [total, todo, inProgress, done, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      })
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name color')
      .populate('assignee', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ total, todo, inProgress, done, overdue, recentTasks, projectCount: userProjects.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks
router.post('/', auth, [
  body('title').trim().isLength({ min: 2 }).withMessage('Title required'),
  body('project').notEmpty().withMessage('Project ID required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project: projectId, assignee, status, priority, dueDate, tags } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    const task = await Task.create({
      title, description, project: projectId, assignee: assignee || null,
      createdBy: req.user._id, status, priority,
      dueDate: dueDate ? new Date(dueDate) : null, tags
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color members');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project._id);
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });

    // Members can only update status/assignee, admins can update everything
    const adminOnly = ['title', 'description', 'priority', 'dueDate', 'tags'];
    const userIsAdmin = isAdmin(project, req.user._id);

    for (const [key, val] of Object.entries(req.body)) {
      if (adminOnly.includes(key) && !userIsAdmin) continue;
      if (key === 'dueDate') task.dueDate = val ? new Date(val) : null;
      else if (key in task) task[key] = val;
    }

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/tasks/:id (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
