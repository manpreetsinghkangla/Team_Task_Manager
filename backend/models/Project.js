const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

// Ensure owner is always in members as admin
projectSchema.pre('save', function(next) {
  const ownerInMembers = this.members.some(m => m.user.toString() === this.owner.toString());
  if (!ownerInMembers) {
    this.members.push({ user: this.owner, role: 'admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
