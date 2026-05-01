import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/projects', label: 'Projects', icon: '◈' },
  { to: '/my-tasks', label: 'My Tasks', icon: '◎' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>✦</div>
          <span className={styles.brandName}>TaskFlow</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
            ⎋
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
