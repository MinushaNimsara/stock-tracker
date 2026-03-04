import { useState, useEffect } from 'react';
import { api } from '../api/client';

const TABS = { USERS: 'users', DESCRIPTIONS: 'descriptions', COLORS: 'colors', UPLOAD: 'upload' };

export default function AdminPanel() {
  const [tab, setTab] = useState(TABS.USERS);
  const [users, setUsers] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // User form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [resetPwdUserId, setResetPwdUserId] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  // Description form
  const [newDescName, setNewDescName] = useState('');
  const [newDescOpening, setNewDescOpening] = useState('');

  // Color form
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#FFFFFF');

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, cRes] = await Promise.all([
        api.listUsers(),
        api.getDescriptions(),
        api.getColors(),
      ]);
      setUsers(uRes.data);
      setDescriptions(dRes.data);
      setColors(cRes.data);
    } catch (err) {
      setMessage('Error loading data: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setMessage('Username and password required');
      return;
    }
    try {
      await api.createUser(newUsername.trim(), newPassword, newRole);
      setMessage('User created');
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwd.trim()) return;
    try {
      await api.resetPassword(resetPwdUserId, resetPwd);
      setMessage('Password reset');
      setResetPwdUserId(null);
      setResetPwd('');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to reset');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.updateUserActive(u.id, !u.active);
      setMessage(u.active ? 'User deactivated' : 'User activated');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed');
    }
  };

  const handleUpdateRole = async (u, role) => {
    try {
      await api.updateUserRole(u.id, role);
      setMessage('Role updated');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.is_master_admin) return;
    if (!confirm(`Delete user ${u.username}?`)) return;
    try {
      await api.deleteUser(u.id);
      setMessage('User deleted');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Cannot delete');
    }
  };

  const handleCreateDescription = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!newDescName.trim()) {
      setMessage('Description name required');
      return;
    }
    try {
      await api.createDescription({
        name: newDescName.trim(),
        opening_stock: parseInt(newDescOpening, 10) || 0,
        active: true,
      });
      setMessage('Description added');
      setNewDescName('');
      setNewDescOpening('');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDeleteDescription = async (id) => {
    if (!confirm('Delete this description?')) return;
    try {
      await api.deleteDescription(id);
      setMessage('Description deleted');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed');
    }
  };

  const handleUploadStoreList = async (e) => {
    e.preventDefault();
    setMessage('');
    setUploadResult(null);
    if (!uploadFile) {
      setMessage('Please select a CSV or Excel file');
      return;
    }
    setUploadLoading(true);
    try {
      const res = await api.uploadStoreList(uploadFile);
      setUploadResult(res.data);
      setUploadFile(null);
      setMessage('');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateColor = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!newColorName.trim()) {
      setMessage('Color name required');
      return;
    }
    try {
      await api.createColor({ name: newColorName.trim(), hex_code: newColorHex });
      setMessage('Color added');
      setNewColorName('');
      setNewColorHex('#FFFFFF');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed');
    }
  };

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Admin Panel</h2>
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === TABS.USERS ? styles.tabActive : {}) }} onClick={() => setTab(TABS.USERS)}>Users</button>
        <button style={{ ...styles.tab, ...(tab === TABS.DESCRIPTIONS ? styles.tabActive : {}) }} onClick={() => setTab(TABS.DESCRIPTIONS)}>Descriptions</button>
        <button style={{ ...styles.tab, ...(tab === TABS.COLORS ? styles.tabActive : {}) }} onClick={() => setTab(TABS.COLORS)}>Colors</button>
      </div>

      {message && <p style={styles.message}>{message}</p>}
      {loading && <p>Loading...</p>}

      {tab === TABS.USERS && (
        <div style={styles.section}>
          <h3>Add User</h3>
          <form onSubmit={handleCreateUser} style={styles.form}>
            <input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={styles.input} />
            <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={styles.input}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={styles.btn}>Create</button>
          </form>

          <h3>Users</h3>
          <table style={styles.table}>
            <thead>
              <tr><th>Username</th><th>Role</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username} {u.is_master_admin && '(Master Admin)'}</td>
                  <td>
                    {u.is_master_admin ? 'admin' : (
                      <select value={u.role} onChange={(e) => handleUpdateRole(u, e.target.value)} style={styles.select}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td>{u.active ? 'Yes' : 'No'}</td>
                  <td>
                    {u.is_master_admin ? (
                      <span style={styles.protected}>Protected</span>
                    ) : (
                      <>
                        <button onClick={() => setResetPwdUserId(u.id)} style={styles.smBtn}>Reset Password</button>
                        <button onClick={() => handleToggleActive(u)} style={styles.smBtn}>{u.active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => handleDeleteUser(u)} style={{ ...styles.smBtn, color: '#b91c1c' }}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {resetPwdUserId && (
            <form onSubmit={handleResetPassword} style={{ ...styles.form, marginTop: 16 }}>
              <input type="password" placeholder="New password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} style={styles.input} required />
              <button type="submit" style={styles.btn}>Reset</button>
              <button type="button" onClick={() => { setResetPwdUserId(null); setResetPwd(''); }} style={styles.smBtn}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {tab === TABS.DESCRIPTIONS && (
        <div style={styles.section}>
          <h3>Add Description</h3>
          <form onSubmit={handleCreateDescription} style={styles.form}>
            <input placeholder="Name" value={newDescName} onChange={(e) => setNewDescName(e.target.value)} style={styles.input} />
            <input type="number" placeholder="Opening stock" value={newDescOpening} onChange={(e) => setNewDescOpening(e.target.value)} style={styles.input} />
            <button type="submit" style={styles.btn}>Add</button>
          </form>
          <ul style={styles.list}>
            {descriptions.map((d) => (
              <li key={d.id} style={styles.listItem}>
                {d.name} (opening: {d.opening_stock})
                <button onClick={() => handleDeleteDescription(d.id)} style={{ ...styles.smBtn, marginLeft: 8 }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === TABS.UPLOAD && (
        <div style={styles.section}>
          <h3>Upload Store List</h3>
          <p style={{ margin: '0 0 16px 0', color: '#4b5563', fontSize: 14 }}>
            Upload CSV or Excel (.xlsx) with <b>Description</b> and <b>Opening Stock</b> columns.
            Existing descriptions are updated; new ones are created.
          </p>
          <form onSubmit={handleUploadStoreList} style={styles.form}>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
            <button type="submit" disabled={uploadLoading || !uploadFile} style={styles.btn}>
              {uploadLoading ? 'Uploading...' : 'Upload & Update'}
            </button>
          </form>
          {uploadResult && (
            <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>
              <p style={{ margin: 0, color: '#15803d', fontWeight: 600 }}>Done</p>
              <p style={{ margin: '8px 0 0 0' }}>Updated: {uploadResult.updated} | Created: {uploadResult.created}</p>
              {uploadResult.errors?.length > 0 && (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#b45309', fontSize: 13 }}>
                  {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {tab === TABS.COLORS && (
        <div style={styles.section}>
          <h3>Add Color</h3>
          <form onSubmit={handleCreateColor} style={styles.form}>
            <input placeholder="Name" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} style={styles.input} />
            <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} style={{ width: 48, height: 36, padding: 2 }} />
            <input value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} style={styles.input} />
            <button type="submit" style={styles.btn}>Add</button>
          </form>
          <ul style={styles.list}>
            {colors.map((c) => (
              <li key={c.id} style={styles.listItem}>
                <span style={{ display: 'inline-block', width: 24, height: 24, backgroundColor: c.hex_code, border: '1px solid #ccc', verticalAlign: 'middle', marginRight: 8 }} />
                {c.name} ({c.hex_code})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 800, margin: '0 auto', padding: 24 },
  title: { margin: '0 0 16px 0', color: '#1a237e' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { padding: '8px 16px', border: '1px solid #1a237e', background: '#fff', borderRadius: 8, cursor: 'pointer' },
  tabActive: { background: '#1a237e', color: '#fff' },
  section: { background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' },
  form: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  input: { padding: 8, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 },
  select: { padding: 6, fontSize: 14 },
  btn: { padding: '8px 16px', background: '#1a237e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  smBtn: { padding: '4px 10px', fontSize: 12, background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' },
  fileInput: { padding: 8, fontSize: 14 },
  message: { color: '#15803d', marginBottom: 12 },
  protected: { color: '#6b7280', fontStyle: 'italic' },
};
