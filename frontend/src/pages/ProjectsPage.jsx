import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import styles from './ProjectsPage.module.css';

const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (project) => {
    setProjects(p => [project, ...p]);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    setProjects(p => p.filter(x => x._id !== id));
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
          <h1>Projects</h1>
          <p className={styles.subtitle}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◈</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks with your team.</p>
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

function ProjectCard({ project, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardBar} style={{ background: project.color }} />
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <Link to={`/projects/${project._id}`} className={styles.cardTitle}>
            {project.name}
          </Link>
          <span className={`${styles.statusBadge} ${styles[project.status]}`}>{project.status}</span>
        </div>
        {project.description && <p className={styles.cardDesc}>{project.description}</p>}
        <div className={styles.cardFooter}>
          <div className={styles.memberAvatars}>
            {project.members.slice(0, 4).map((m, i) => (
              <div key={i} className={styles.memberAvatar} title={m.user?.name} style={{ zIndex: 4 - i }}>
                {m.user?.name?.[0]?.toUpperCase()}
                {m.role === 'admin' && <span className={styles.adminDot} />}
              </div>
            ))}
            {project.members.length > 4 && (
              <div className={styles.memberMore}>+{project.members.length - 4}</div>
            )}
          </div>
          <div className={styles.cardActions}>
            <span className={styles.cardDate}>{format(new Date(project.createdAt), 'MMM d')}</span>
            <Link to={`/projects/${project._id}`} className={styles.viewBtn}>View →</Link>
            <button className={styles.deleteBtn} onClick={() => onDelete(project._id)}>✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/projects', form);
      onCreate(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>New Project</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Project Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Marketing Campaign"
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What's this project about?"
              rows={3}
            />
          </div>
          <div className={styles.field}>
            <label>Color</label>
            <div className={styles.colorPicker}>
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${form.color === c ? styles.selected : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
