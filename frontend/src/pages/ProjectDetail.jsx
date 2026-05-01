import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isAfter } from 'date-fns';
import styles from './ProjectDetail.module.css';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#8888a8' },
  { key: 'in-progress', label: 'In Progress', color: '#7c6dfa' },
  { key: 'review', label: 'Review', color: '#fbbf24' },
  { key: 'done', label: 'Done', color: '#34d399' },
];

const PRIORITY_COLORS = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24', urgent: '#f87171' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = project?.members?.some(m => m.user?._id === user?._id && m.role === 'admin');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreate = (task) => {
    setTasks(t => [task, ...t]);
    setShowTaskModal(false);
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updates);
      setTasks(t => t.map(x => x._id === taskId ? res.data : x));
      setEditingTask(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(t => t.filter(x => x._id !== taskId));
    setEditingTask(null);
  };

  const handleStatusChange = (taskId, newStatus) => handleTaskUpdate(taskId, { status: newStatus });

  if (loading) return (
    <div className={styles.loading}>
      <div className="animate-spin" style={{width:32,height:32,border:'3px solid var(--border)',borderTop:'3px solid var(--accent)',borderRadius:'50%'}} />
    </div>
  );

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.colorDot} style={{ background: project.color }} />
          <div>
            <h1 className={styles.title}>{project.name}</h1>
            {project.description && <p className={styles.desc}>{project.description}</p>}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.memberPills}>
            {project.members.slice(0, 5).map((m, i) => (
              <div key={i} className={styles.memberPill} title={`${m.user?.name} (${m.role})`}>
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {project.members.length > 5 && <span className={styles.moreMembers}>+{project.members.length - 5}</span>}
          </div>
          {isAdmin && (
            <button className={styles.membersBtn} onClick={() => setShowMembersModal(true)}>
              ⚙ Team
            </button>
          )}
          <button className={styles.addTaskBtn} onClick={() => setShowTaskModal(true)}>
            + Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['board', 'list'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'board' ? '⊞ Board' : '☰ List'}
          </button>
        ))}
        <span className={styles.taskCount}>{tasks.length} tasks</span>
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div className={styles.board}>
          {COLUMNS.map(col => (
            <div key={col.key} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnDot} style={{ background: col.color }} />
                <span className={styles.columnLabel}>{col.label}</span>
                <span className={styles.columnCount}>{tasksByStatus[col.key].length}</span>
              </div>
              <div className={styles.columnCards}>
                {tasksByStatus[col.key].map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onStatusChange={handleStatusChange}
                    columns={COLUMNS}
                    isAdmin={isAdmin}
                  />
                ))}
                {tasksByStatus[col.key].length === 0 && (
                  <div className={styles.emptyCol}>No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className={styles.listView}>
          <div className={styles.listHeader}>
            <span>Task</span><span>Assignee</span><span>Priority</span><span>Due Date</span><span>Status</span>
          </div>
          {tasks.length === 0 ? (
            <div className={styles.emptyList}>No tasks yet. Click "+ Task" to create one.</div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className={styles.listRow} onClick={() => setEditingTask(task)}>
                <span className={styles.listTitle}>
                  <span className={styles.listDot} style={{ background: PRIORITY_COLORS[task.priority] }} />
                  {task.title}
                  {task.isOverdue && <span className={styles.overdueTag}>Overdue</span>}
                </span>
                <span className={styles.listAssignee}>{task.assignee?.name || '—'}</span>
                <span className={styles.listPriority} style={{ color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
                <span className={styles.listDue}>{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}</span>
                <span className={styles.listStatus} style={{
                  color: COLUMNS.find(c => c.key === task.status)?.color,
                  background: COLUMNS.find(c => c.key === task.status)?.color + '18'
                }}>
                  {COLUMNS.find(c => c.key === task.status)?.label}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          projectId={id}
          members={project.members}
          onClose={() => setShowTaskModal(false)}
          onCreate={handleTaskCreate}
        />
      )}
      {editingTask && (
        <TaskModal
          projectId={id}
          members={project.members}
          task={editingTask}
          isAdmin={isAdmin}
          onClose={() => setEditingTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
      {showMembersModal && (
        <MembersModal
          project={project}
          currentUser={user}
          onClose={() => setShowMembersModal(false)}
          onUpdate={setProject}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onStatusChange, columns, isAdmin }) {
  const overdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div className={styles.card} onClick={onEdit}>
      <div className={styles.cardTop}>
        <p className={styles.cardTitle}>{task.title}</p>
        <span className={styles.priorityDot} style={{ background: PRIORITY_COLORS[task.priority] }} title={task.priority} />
      </div>
      {task.description && <p className={styles.cardDesc}>{task.description}</p>}
      <div className={styles.cardBottom}>
        <div className={styles.cardMeta}>
          {task.assignee && (
            <span className={styles.assigneeChip}>{task.assignee.name[0].toUpperCase()}</span>
          )}
          {task.dueDate && (
            <span className={overdue ? styles.overdueDate : styles.dueDate}>
              {overdue ? '⚠ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.tags?.length > 0 && (
            <span className={styles.tag}>{task.tags[0]}</span>
          )}
        </div>
        <select
          className={styles.statusSelect}
          value={task.status}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onStatusChange(task._id, e.target.value); }}
        >
          {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function TaskModal({ projectId, members, task, isAdmin, onClose, onCreate, onUpdate, onDelete }) {
  const isEdit = !!task;
  const canEdit = !isEdit || isAdmin;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee?._id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task?.tags?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      assignee: form.assignee || null,
      dueDate: form.dueDate || null,
      project: projectId,
    };
    try {
      if (isEdit) {
        await onUpdate(task._id, payload);
      } else {
        const res = await api.post('/tasks', payload);
        onCreate(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <div style={{ display:'flex', gap:8 }}>
            {isEdit && isAdmin && (
              <button className={styles.dangerBtn} onClick={() => onDelete(task._id)}>Delete</button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} required disabled={isEdit && !canEdit} placeholder="Task title" autoFocus />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} disabled={isEdit && !canEdit} placeholder="Details…" />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} disabled={isEdit && !canEdit}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Assignee</label>
              <select value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} disabled={isEdit && !canEdit} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Tags (comma separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} disabled={isEdit && !canEdit} placeholder="design, frontend, bug…" />
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MembersModal({ project, currentUser, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/projects/${project._id}/members`, { email, role });
      onUpdate(res.data);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    const res = await api.delete(`/projects/${project._id}/members/${userId}`);
    onUpdate(res.data);
  };

  const changeRole = async (userId, newRole) => {
    const res = await api.put(`/projects/${project._id}/members/${userId}/role`, { role: newRole });
    onUpdate(res.data);
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Team Members</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.memberList}>
          {project.members.map(m => (
            <div key={m.user?._id} className={styles.memberRow}>
              <div className={styles.memberAvatar2}>{m.user?.name?.[0]?.toUpperCase()}</div>
              <div className={styles.memberInfo}>
                <p className={styles.memberName}>{m.user?.name} {m.user?._id === currentUser._id && <span className={styles.youBadge}>you</span>}</p>
                <p className={styles.memberEmail}>{m.user?.email}</p>
              </div>
              <select
                className={styles.roleSelect}
                value={m.role}
                disabled={m.user?._id === project.owner._id}
                onChange={e => changeRole(m.user._id, e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {m.user?._id !== project.owner._id && (
                <button className={styles.removeBtn} onClick={() => removeMember(m.user._id)}>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.addMemberSection}>
          <p className={styles.addTitle}>Add Member</p>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={addMember} className={styles.addForm}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '…' : 'Add'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
