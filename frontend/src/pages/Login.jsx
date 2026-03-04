import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = typeof detail === 'string' ? detail
        : Array.isArray(detail) ? detail.map((d) => d?.msg || d).join(', ')
        : err.response?.data?.message || err.message;
      if (!msg) {
        const status = err.response?.status;
        msg = status ? `Login failed (HTTP ${status})` : 'Login failed. Check network.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div style={styles.wrap}>Loading...</div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Rich Light Apparels</h1>
        <p style={styles.subtitle}>A4 Format Stock Management</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
            maxLength={72}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 32,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  title: { margin: '0 0 4px 0', color: '#1a237e', fontSize: '1.5rem' },
  subtitle: { margin: '0 0 24px 0', color: '#6b7280', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  input: {
    padding: 12,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 16,
  },
  error: { color: '#b91c1c', margin: 0, fontSize: 14 },
  btn: {
    padding: 12,
    background: '#1a237e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
