const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: check if user is project admin
const isAdmin = (project, userId) =>
  project.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');

// Helper: check if user is project member
const isMember = (project, userId) =>
  project.members.some(m => m.user.toString() === userId.toString());

// GET /api/projects - Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/projects - Create project
router.post('/', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name required'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name,
      description,
      color: color || '#6366f1',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isMember(project, req.user._id)) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/projects/:id - Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });

    const { name, description, color, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/projects/:id (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/projects/:id/members - Add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });

    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (isMember(project, user._id)) return res.status(400).json({ message: 'User already a member' });

    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/projects/:id/members/:userId (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });
    if (req.params.userId === project.owner.toString()) return res.status(400).json({ message: 'Cannot remove project owner' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/projects/:id/members/:userId/role (admin only)
router.put('/:id/members/:userId/role', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isAdmin(project, req.user._id)) return res.status(403).json({ message: 'Admin access required' });

    const member = project.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    member.role = req.body.role;
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
