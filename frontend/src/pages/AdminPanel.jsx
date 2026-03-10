import { useState, useEffect } from 'react';
import { api } from '../api/client';

const TABS = { USERS: 'users', DESCRIPTIONS: 'descriptions', COLORS: 'colors', ENTRIES: 'entries', UPLOAD: 'upload' };

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
  const [newDescSize, setNewDescSize] = useState('');
  const [newDescOpening, setNewDescOpening] = useState('');
  const [newDescPrice, setNewDescPrice] = useState('');

  // Color form
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#FFFFFF');

  // Stock entries
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryFilterStart, setEntryFilterStart] = useState('');
  const [entryFilterEnd, setEntryFilterEnd] = useState('');
  const [editEntry, setEditEntry] = useState(null);
  const [editForm, setEditForm] = useState({});

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
      const d = err.response?.data?.detail;
      const msg = Array.isArray(d)
        ? d.map((x) => x?.msg || JSON.stringify(x)).join('; ')
        : typeof d === 'string'
          ? d
          : err.response?.status === 400
            ? 'Username may already exist. Try a different username.'
            : err.message || 'Failed to create user. Check connection.';
      setMessage(msg);
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

  const descNameAndPriceExists = (name, price) =>
    descriptions.some(
      (d) =>
        d.name.toLowerCase().trim() === (name || '').toLowerCase().trim() &&
        (Number(d.price) || 0) === (parseFloat(price) || 0)
    );

  const filteredDescriptions = newDescName.trim()
    ? descriptions.filter((d) => d.name.toLowerCase().includes(newDescName.toLowerCase().trim()))
    : descriptions;

  const handleCreateDescription = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!newDescName.trim()) {
      setMessage('Description name required');
      return;
    }
    if (descNameAndPriceExists(newDescName, newDescPrice)) {
      setMessage('A description with this name and price already exists');
      return;
    }
    try {
      await api.createDescription({
        name: newDescName.trim(),
        size: (newDescSize || '').trim(),
        opening_stock: parseInt(newDescOpening, 10) || 0,
        price: parseFloat(newDescPrice) || 0,
        active: true,
      });
      setMessage('Description added');
      setNewDescName('');
      setNewDescSize('');
      setNewDescOpening('');
      setNewDescPrice('');
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      const d = err.response?.data?.detail;
      const msg = Array.isArray(d) ? d.map((x) => x?.msg || JSON.stringify(x)).join('; ') : (typeof d === 'string' ? d : err.message || 'Upload failed');
      setMessage(msg);
    } finally {
      setUploadLoading(false);
    }
  };

  const loadEntries = async () => {
    setEntriesLoading(true);
    try {
      const params = {};
      if (entryFilterStart) params.start = entryFilterStart;
      if (entryFilterEnd) params.end = entryFilterEnd;
      const res = await api.listStockEntries(params);
      setEntries(res.data);
    } catch (err) {
      setMessage('Error loading entries: ' + (err.response?.data?.detail || err.message));
    } finally {
      setEntriesLoading(false);
    }
  };

  const openEditEntry = (e) => {
    setEditEntry(e);
    setEditForm({
      entry_date: e.entry_date,
      description_id: e.description_id,
      color_id: e.color_id,
      purchase_qty: e.purchase_qty,
      usage_qty: e.usage_qty,
      reason: e.reason || '',
    });
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!editEntry) return;
    try {
      await api.updateStockEntry(editEntry.id, editForm);
      setMessage('Entry updated');
      setEditEntry(null);
      loadEntries();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Update failed');
    }
  };

  const handleDeleteEntry = async (entry) => {
    if (!confirm(`Delete entry #${entry.id}?`)) return;
    try {
      await api.deleteStockEntry(entry.id);
      setMessage('Entry deleted');
      loadEntries();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Delete failed');
    }
  };

  const getDescLabel = (d) => `${d?.name ?? '?'} (${d?.price ?? 0})`;
  const getDescName = (id) => {
    const d = descriptions.find((x) => x.id === id);
    return d ? getDescLabel(d) : `#${id}`;
  };
  const getColorName = (id) => colors.find((c) => c.id === id)?.name || `#${id}`;

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
        <button style={{ ...styles.tab, ...(tab === TABS.ENTRIES ? styles.tabActive : {}) }} onClick={() => { setTab(TABS.ENTRIES); loadEntries(); }}>Entries</button>
        <button style={{ ...styles.tab, ...(tab === TABS.UPLOAD ? styles.tabActive : {}) }} onClick={() => setTab(TABS.UPLOAD)}>Upload</button>
      </div>

      {message && (
        <p style={{
          ...styles.message,
          color: /fail|error|already exist|required|invalid/i.test(message) ? '#b91c1c' : styles.message.color,
        }}>{message}</p>
      )}
      {loading && <p>Loading...</p>}

      {tab === TABS.USERS && (
        <div style={styles.section}>
          <h3 style={styles.subtitle}>Add User</h3>
          <form onSubmit={handleCreateUser} style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input placeholder="e.g. jsmith" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={styles.selectInput}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ ...styles.formGroup, alignSelf: 'flex-end' }}>
              <label style={{ ...styles.label, opacity: 0 }}>&nbsp;</label>
              <button type="submit" style={styles.btn}>Create</button>
            </div>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0 16px 0' }} />
          <h3 style={styles.subtitle}>Users</h3>
          <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Active</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.username} {u.is_master_admin && '(Master Admin)'}</td>
                  <td style={styles.td}>
                    {u.is_master_admin ? 'admin' : (
                      <select value={u.role} onChange={(e) => handleUpdateRole(u, e.target.value)} style={styles.select}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td style={styles.td}>{u.active ? 'Yes' : 'No'}</td>
                  <td style={styles.td}>
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
          </div>

          {resetPwdUserId && (
            <form onSubmit={handleResetPassword} style={{ ...styles.formRow, marginTop: 16 }}>
              <input type="password" placeholder="New password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} style={styles.input} required />
              <button type="submit" style={styles.btn}>Reset</button>
              <button type="button" onClick={() => { setResetPwdUserId(null); setResetPwd(''); }} style={styles.smBtn}>Cancel</button>
            </form>
          )}
        </div>
      )}

      {tab === TABS.DESCRIPTIONS && (
        <div style={styles.section}>
          <h3 style={styles.subtitle}>Add Description</h3>
          <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: 13 }}>Type to filter the list. Duplicate names cannot be added.</p>
          <form onSubmit={handleCreateDescription} style={styles.formRow}>
            <input placeholder="Name (Details)" value={newDescName} onChange={(e) => setNewDescName(e.target.value)} style={styles.input} />
            <input placeholder="Size" value={newDescSize} onChange={(e) => setNewDescSize(e.target.value)} style={styles.input} />
            <input type="number" placeholder="Price" value={newDescPrice} onChange={(e) => setNewDescPrice(e.target.value)} style={styles.input} />
            <input type="number" placeholder="Opening stock" value={newDescOpening} onChange={(e) => setNewDescOpening(e.target.value)} style={styles.input} />
            <button type="submit" disabled={descNameAndPriceExists(newDescName, newDescPrice)} style={{ ...styles.btn, ...(descNameAndPriceExists(newDescName, newDescPrice) ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}>Add</button>
          </form>
          <ul style={styles.list}>
            {filteredDescriptions.map((d) => (
              <li key={d.id} style={styles.listItem}>
                {d.name} {d.size ? `(${d.size})` : ''} - price: {d.price ?? 0}, opening: {d.opening_stock}
                <button onClick={() => handleDeleteDescription(d.id)} style={{ ...styles.smBtn, marginLeft: 8 }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === TABS.ENTRIES && (
        <div style={styles.section}>
          <h3 style={styles.subtitle}>Stock Entries</h3>
          <div style={{ ...styles.formRow, marginBottom: 16 }}>
            <input type="date" placeholder="Start" value={entryFilterStart} onChange={(e) => setEntryFilterStart(e.target.value)} style={styles.input} />
            <input type="date" placeholder="End" value={entryFilterEnd} onChange={(e) => setEntryFilterEnd(e.target.value)} style={styles.input} />
            <button type="button" onClick={loadEntries} style={styles.btn}>Filter</button>
          </div>
          {entriesLoading && <p>Loading...</p>}
          <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Color</th>
                <th style={styles.th}>Purchase</th>
                <th style={styles.th}>Usage</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  <td style={styles.td}>{entry.entry_date}</td>
                  <td style={styles.td}>{getDescName(entry.description_id)}</td>
                  <td style={styles.td}>{getColorName(entry.color_id)}</td>
                  <td style={styles.td}>{entry.purchase_qty}</td>
                  <td style={styles.td}>{entry.usage_qty}</td>
                  <td style={{ ...styles.td, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.reason || '-'}</td>
                  <td style={styles.td}>
                    <button onClick={() => openEditEntry(entry)} style={styles.smBtn}>Edit</button>
                    <button onClick={() => handleDeleteEntry(entry)} style={{ ...styles.smBtn, color: '#b91c1c' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {entries.length === 0 && !entriesLoading && <p>No entries found.</p>}

          {editEntry && (
            <div style={{ marginTop: 20, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <h4 style={{ margin: '0 0 16px 0' }}>Edit Entry #{editEntry.id}</h4>
              <form onSubmit={handleUpdateEntry} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ ...styles.formRow, marginBottom: 0 }}>
                  <input type="date" value={editForm.entry_date} onChange={(e) => setEditForm((f) => ({ ...f, entry_date: e.target.value }))} style={styles.input} required />
                  <select value={editForm.description_id} onChange={(e) => setEditForm((f) => ({ ...f, description_id: Number(e.target.value) }))} style={styles.select} required>
                    {descriptions.map((d) => <option key={d.id} value={d.id}>{getDescLabel(d)}</option>)}
                  </select>
                  <select value={editForm.color_id} onChange={(e) => setEditForm((f) => ({ ...f, color_id: Number(e.target.value) }))} style={styles.select} required>
                    {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ ...styles.formRow, marginBottom: 0 }}>
                  <input type="number" min="0" placeholder="Purchase" value={editForm.purchase_qty} onChange={(e) => setEditForm((f) => ({ ...f, purchase_qty: Number(e.target.value) || 0 }))} style={styles.input} />
                  <input type="number" min="0" placeholder="Usage" value={editForm.usage_qty} onChange={(e) => setEditForm((f) => ({ ...f, usage_qty: Number(e.target.value) || 0 }))} style={styles.input} />
                  <input placeholder="Reason" value={editForm.reason} onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))} style={styles.input} />
                </div>
                <div style={{ ...styles.formRow, marginBottom: 0 }}>
                  <button type="submit" style={styles.btn}>Save</button>
                  <button type="button" onClick={() => setEditEntry(null)} style={styles.smBtn}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === TABS.UPLOAD && (
        <div style={styles.section}>
          <h3 style={styles.subtitle}>Upload Store List</h3>
          <p style={{ margin: '0 0 16px 0', color: '#4b5563', fontSize: 14 }}>
            Upload CSV or Excel (.xlsx) with <b>Description</b> and <b>Opening Stock</b> columns.
            Existing descriptions are updated; new ones are created.
          </p>
          <div style={styles.formRow}>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={styles.fileInput}
            />
            <button
              type="button"
              disabled={uploadLoading || !uploadFile}
              onClick={(e) => { e.preventDefault(); handleUploadStoreList(e); }}
              style={styles.btn}
            >
              {uploadLoading ? 'Uploading...' : 'Upload & Update'}
            </button>
          </div>
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
          <h3 style={styles.subtitle}>Add Color</h3>
          <form onSubmit={handleCreateColor} style={styles.formRow}>
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
  wrap: { maxWidth: 900, margin: '0 auto', padding: 24, color: '#1f2937' },
  title: { margin: '0 0 16px 0', color: '#1a237e' },
  subtitle: { margin: '0 0 12px 0', fontSize: '1.1rem', color: '#374151' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', paddingBottom: 0 },
  tab: { padding: '12px 20px', border: 'none', borderBottom: '3px solid transparent', background: 'transparent', color: '#4b5563', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  tabActive: { color: '#1a237e', borderBottom: '3px solid #1a237e', fontWeight: 600 },
  section: { background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', color: '#1f2937' },
  form: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  formRow: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: { padding: '10px 12px', height: 40, boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 140, color: '#1f2937', backgroundColor: '#fff' },
  selectInput: { padding: '10px 12px', height: 40, boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 100, color: '#1f2937', backgroundColor: '#fff' },
  select: { padding: '8px 10px', height: 36, boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, color: '#1f2937', backgroundColor: '#fff' },
  btn: { padding: '10px 18px', height: 40, boxSizing: 'border-box', background: '#1a237e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  smBtn: { padding: '6px 12px', fontSize: 12, background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', marginRight: 6 },
  tableWrap: { overflowX: 'auto', marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { padding: '12px 14px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb', fontWeight: 600, color: '#1f2937' },
  td: { padding: '12px 14px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle', color: '#374151' },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' },
  fileInput: { padding: 8, fontSize: 14 },
  message: { color: '#15803d', marginBottom: 12 },
  protected: { color: '#4b5563', fontStyle: 'italic' },
};
