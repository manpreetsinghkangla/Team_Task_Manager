import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isAfter } from 'date-fns';
import styles from './Dashboard.module.css';

const PRIORITY_COLORS = { low: '#34d399', medium: '#60a5fa', high: '#fbbf24', urgent: '#f87171' };
const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };
const STATUS_COLORS = { todo: '#8888a8', 'in-progress': '#7c6dfa', review: '#fbbf24', done: '#34d399' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className="animate-spin" style={{width:32,height:32,border:'3px solid var(--border)',borderTop:'3px solid var(--accent)',borderRadius:'50%'}} />
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>{greeting},</p>
          <h1 className={styles.name}>{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <p className={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total Tasks" value={stats?.total ?? 0} icon="◈" color="var(--accent)" />
        <StatCard label="To Do" value={stats?.todo ?? 0} icon="○" color="var(--text-secondary)" />
        <StatCard label="In Progress" value={stats?.inProgress ?? 0} icon="◑" color="#7c6dfa" />
        <StatCard label="Completed" value={stats?.done ?? 0} icon="●" color="var(--success)" />
        <StatCard label="Overdue" value={stats?.overdue ?? 0} icon="⚠" color="var(--danger)" highlight={stats?.overdue > 0} />
        <StatCard label="Projects" value={stats?.projectCount ?? 0} icon="◫" color="var(--info)" />
      </div>

      <div className={styles.bottom}>
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2>Recent Tasks</h2>
            <Link to="/my-tasks" className={styles.seeAll}>View all →</Link>
          </div>
          {stats?.recentTasks?.length === 0 ? (
            <EmptyState message="No tasks yet. Create a project to get started!" />
          ) : (
            <div className={styles.taskList}>
              {stats?.recentTasks?.map(task => (
                <div key={task._id} className={styles.taskItem}>
                  <div className={styles.taskLeft}>
                    <span className={styles.taskDot} style={{ background: PRIORITY_COLORS[task.priority] }} />
                    <div>
                      <p className={styles.taskTitle}>{task.title}</p>
                      <p className={styles.taskMeta}>
                        <span style={{ color: task.project?.color || 'var(--accent)' }}>
                          {task.project?.name}
                        </span>
                        {task.dueDate && (
                          <span className={isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done' ? styles.overdue : styles.dueDate}>
                            · Due {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={styles.statusBadge} style={{ color: STATUS_COLORS[task.status], background: STATUS_COLORS[task.status] + '18' }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.quickActions}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Quick Actions</h2>
          <Link to="/projects" className={styles.actionCard}>
            <span className={styles.actionIcon} style={{ background: 'rgba(124,109,250,0.15)', color: 'var(--accent)' }}>◈</span>
            <div>
              <p className={styles.actionTitle}>New Project</p>
              <p className={styles.actionDesc}>Create a project & invite team</p>
            </div>
          </Link>
          <Link to="/my-tasks" className={styles.actionCard}>
            <span className={styles.actionIcon} style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--info)' }}>◎</span>
            <div>
              <p className={styles.actionTitle}>My Tasks</p>
              <p className={styles.actionDesc}>See all tasks assigned to you</p>
            </div>
          </Link>
          <Link to="/projects" className={styles.actionCard}>
            <span className={styles.actionIcon} style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--warning)' }}>⚑</span>
            <div>
              <p className={styles.actionTitle}>Browse Projects</p>
              <p className={styles.actionDesc}>View and manage all projects</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, highlight }) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statHighlight : ''}`}>
      <div className={styles.statIcon} style={{ color, background: color + '18' }}>{icon}</div>
      <div>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className={styles.emptyState}>
      <p>{message}</p>
    </div>
  );
}
