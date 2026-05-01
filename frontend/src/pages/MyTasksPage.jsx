import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import styles from './MyTasksPage.module.css';

const PRIORITY_COLORS = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24', urgent: '#f87171' };
const STATUS_COLORS = { todo: '#8888a8', 'in-progress': '#7c6dfa', review: '#fbbf24', done: '#34d399' };
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    api.get('/tasks/my')
      .then(res => setTasks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const soon = addDays(now, 3);

  const filtered = tasks.filter(t => {
    const statusOk = filter === 'all' || filter === t.status ||
      (filter === 'overdue' && t.dueDate && isAfter(now, new Date(t.dueDate)) && t.status !== 'done') ||
      (filter === 'due-soon' && t.dueDate && isBefore(new Date(t.dueDate), soon) && !isAfter(now, new Date(t.dueDate)) && t.status !== 'done');
    const prioOk = priorityFilter === 'all' || priorityFilter === t.priority;
    return statusOk && prioOk;
  });

  const counts = {
    all: tasks.length,
    overdue: tasks.filter(t => t.dueDate && isAfter(now, new Date(t.dueDate)) && t.status !== 'done').length,
    'due-soon': tasks.filter(t => t.dueDate && isBefore(new Date(t.dueDate), soon) && !isAfter(now, new Date(t.dueDate)) && t.status !== 'done').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status });
      setTasks(t => t.map(x => x._id === taskId ? res.data : x));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className="animate-spin" style={{width:32,height:32,border:'3px solid var(--border)',borderTop:'3px solid var(--accent)',borderRadius:'50%'}} />
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>My Tasks</h1>
          <p className={styles.subtitle}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {[
            { key: 'all', label: 'All' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'overdue', label: '⚠ Overdue' },
            { key: 'due-soon', label: '⏰ Due Soon' },
            { key: 'done', label: '✓ Done' },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.activeFilter : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {counts[f.key] > 0 && <span className={styles.filterCount}>{counts[f.key]}</span>}
            </button>
          ))}
        </div>
        <select
          className={styles.prioritySelect}
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◎</div>
          <h3>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}</h3>
          <p>{tasks.length === 0 ? 'Tasks assigned to you will appear here.' : 'Try changing the filters above.'}</p>
        </div>
      ) : (
        <div className={styles.taskGrid}>
          {filtered.map(task => (
            <TaskRow key={task._id} task={task} now={now} onStatusChange={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, now, onStatusChange }) {
  const overdue = task.dueDate && isAfter(now, new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div className={`${styles.taskCard} ${overdue ? styles.overdueCard : ''}`}>
      <div className={styles.taskMain}>
        <div className={styles.priorityBar} style={{ background: PRIORITY_COLORS[task.priority] }} />
        <div className={styles.taskContent}>
          <div className={styles.taskTop}>
            <Link to={`/projects/${task.project?._id}`} className={styles.projectLink} style={{ color: task.project?.color || 'var(--accent)' }}>
              {task.project?.name}
            </Link>
            {overdue && <span className={styles.overdueTag}>Overdue</span>}
          </div>
          <p className={styles.taskTitle}>{task.title}</p>
          {task.description && <p className={styles.taskDesc}>{task.description}</p>}
          <div className={styles.taskMeta}>
            <span className={styles.priorityTag} style={{ color: PRIORITY_COLORS[task.priority], background: PRIORITY_COLORS[task.priority] + '18' }}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className={overdue ? styles.dueDateOverdue : styles.dueDate}>
                {overdue ? '⚠ ' : ''}Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
            {task.tags?.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.taskActions}>
        <select
          className={styles.statusSelect}
          value={task.status}
          onChange={e => onStatusChange(task._id, e.target.value)}
          style={{ color: STATUS_COLORS[task.status] }}
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
