import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav style={styles.nav}>
      <div style={styles.brandContainer}>
        <img src={logo} alt="RLA Logo" style={styles.logoImage} />
        <div style={styles.brandInfo}>
          <h1 style={styles.brandName}>Rich Light Apparels</h1>
          <p style={styles.brandTagline}>A4 Format Stock Management System</p>
        </div>
      </div>

      <div style={styles.navLinks}>
        {user ? (
          <>
            <Link
              to="/"
              style={{
                ...styles.navLink,
                ...(location.pathname === '/' ? styles.activeLink : {}),
              }}
            >
              📝 Store Entry
            </Link>
            <Link
              to="/report"
              style={{
                ...styles.navLink,
                ...(location.pathname === '/report' ? styles.activeLink : {}),
              }}
            >
              📊 Monthly Report
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  ...styles.navLink,
                  ...(location.pathname === '/admin' ? styles.activeLink : {}),
                }}
              >
                🛠️ Admin
              </Link>
            )}
            <span style={styles.userSpan}>{user.username}</span>
            <button onClick={() => { logout(); navigate('/login'); }} style={styles.logoutBtn}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={styles.navLink}>Login</Link>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1a237e',
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoImage: {
    width: '70px',
    height: '70px',
    objectFit: 'contain',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  brandInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandName: {
    margin: 0,
    color: '#fff',
    fontSize: '1.6rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  brandTagline: {
    margin: 0,
    color: '#b0bec5',
    fontSize: '0.85rem',
    fontWeight: '400',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
  },
  navLink: {
    padding: '0.7rem 1.5rem',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeLink: {
    backgroundColor: '#fff',
    color: '#1a237e',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  userSpan: { color: '#b0bec5', fontSize: '0.9rem', padding: '0 8px' },
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
};
