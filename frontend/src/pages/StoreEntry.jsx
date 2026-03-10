import { useState, useEffect } from 'react';
import { api } from '../api/client';

const IN_DEPTS = ['PACKING', 'HR & PROCESS', 'QUALITY', 'OFFICE'];
const OUT_DEPTS = ['PRODUCTION', 'STORES', 'CUTTING', 'PACKING', 'HR & PROCESS', 'QUALITY', 'OFFICE'];

export default function StoreEntry() {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showNewDescModal, setShowNewDescModal] = useState(false);
  const [newDesc, setNewDesc] = useState({ name: '', size: '', price: '', openingStock: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = searchTerm.trim()
    ? rows.filter(
        (r) =>
          (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.size || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  const loadGrid = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [gridRes, deptRes] = await Promise.all([
        api.getDeptGrid(entryDate),
        api.getDepartments(),
      ]);
      const grid = gridRes.data;
      const depts = deptRes.data;
      setRows(grid.rows || []);
    } catch (err) {
      setMessage('Error loading data: ' + (err.response?.data?.detail || err.message));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrid();
  }, [entryDate]);

  const getCell = (row, dept, type) => {
    const d = row.departments?.[dept];
    if (!d) return 0;
    return type === 'in' ? (d.in_qty || 0) : (d.out_qty || 0);
  };

  const setCell = (descId, dept, type, value) => {
    const num = parseInt(value, 10) || 0;
    setRows((prev) =>
      prev.map((r) => {
        if (r.description_id !== descId) return r;
        const deps = { ...(r.departments || {}) };
        if (!deps[dept]) deps[dept] = { in_qty: 0, out_qty: 0 };
        deps[dept] = { ...deps[dept], [type === 'in' ? 'in_qty' : 'out_qty']: num };
        return { ...r, departments: deps };
      })
    );
  };

  const handleAddNewDescription = async (e) => {
    e.preventDefault();
    if (!newDesc.name.trim()) {
      setMessage('Please enter Description (Details)');
      return;
    }
    const priceVal = newDesc.price === '' ? 0 : parseFloat(newDesc.price) || 0;
    const duplicate = rows.find(
      (r) =>
        r.description.toLowerCase().trim() === newDesc.name.toLowerCase().trim() &&
        (Number(r.price) || 0) === priceVal
    );
    if (duplicate) {
      setMessage(`Item "${duplicate.description}" with same price already exists`);
      return;
    }
    try {
      await api.createDescription({
        name: newDesc.name.trim(),
        size: (newDesc.size || '').trim(),
        price: priceVal,
        opening_stock: newDesc.openingStock === '' ? 0 : parseInt(newDesc.openingStock, 10) || 0,
        active: true,
      });
      setMessage('Item added successfully');
      setNewDesc({ name: '', size: '', price: '', openingStock: '' });
      setShowNewDescModal(false);
      loadGrid();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const entries = [];
      for (const row of rows) {
        const allDepts = [...new Set([...IN_DEPTS, ...OUT_DEPTS])];
        for (const dept of allDepts) {
          const inV = IN_DEPTS.includes(dept) ? (getCell(row, dept, 'in') || 0) : 0;
          const outV = OUT_DEPTS.includes(dept) ? (getCell(row, dept, 'out') || 0) : 0;
          if (inV > 0 || outV > 0) {
            entries.push({ description_id: row.description_id, department: dept, in_qty: inV, out_qty: outV });
          }
        }
      }
      await api.saveDeptGrid({ entry_date: entryDate, entries });
      setMessage('Saved successfully');
      loadGrid();
    } catch (err) {
      setMessage('Error saving: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.company}>RICH LIGHT APPARELS PVT LTD</h1>
        <h2 style={styles.title}>GENERAL ITEM STOCK ITEM</h2>
      </div>

      <div style={styles.controls}>
        <label style={styles.label}>
          Date:
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            style={styles.dateInput}
          />
        </label>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} style={styles.clearSearchBtn} title="Clear">✕</button>
          )}
        </div>
        <button onClick={handleSave} disabled={saving || loading} style={styles.saveBtn}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={() => setShowNewDescModal(true)} style={styles.newDescBtn}>
          ➕ New Description
        </button>
      </div>

      {message && (
        <div style={message.startsWith('Error') ? styles.errorMsg : styles.successMsg}>{message}</div>
      )}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thDetail}>DETAILS</th>
                <th style={styles.th}>SIZE</th>
                <th style={styles.th}>PRICE</th>
                <th style={styles.th}>STOCK</th>
                {IN_DEPTS.map((d) => (
                  <th key={`in-${d}`} style={styles.thIn}>IN {d}</th>
                ))}
                {OUT_DEPTS.map((d) => (
                  <th key={`out-${d}`} style={styles.thOut}>OUT {d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.description_id}>
                  <td style={styles.tdDetail}>{row.description}</td>
                  <td style={styles.td}>{row.size ?? ''}</td>
                  <td style={styles.td}>{row.price ?? 0}</td>
                  <td style={styles.td}>{row.opening_stock ?? 0}</td>
                  {IN_DEPTS.map((dept) => (
                    <td key={`in-${dept}`} style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        value={getCell(row, dept, 'in') || ''}
                        onChange={(e) => setCell(row.description_id, dept, 'in', e.target.value)}
                        style={styles.input}
                      />
                    </td>
                  ))}
                  {OUT_DEPTS.map((dept) => (
                    <td key={`out-${dept}`} style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        value={getCell(row, dept, 'out') || ''}
                        onChange={(e) => setCell(row.description_id, dept, 'out', e.target.value)}
                        style={styles.input}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p style={styles.empty}>No items yet. Click "➕ New Description" to add.</p>
      )}
      {!loading && rows.length > 0 && filteredRows.length === 0 && (
        <p style={styles.empty}>No items match your search. Try a different term.</p>
      )}

      {showNewDescModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewDescModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>➕ Add New Item</h2>
            <form onSubmit={handleAddNewDescription} style={styles.modalForm}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Description (Details) *</label>
                <input
                  value={newDesc.name}
                  onChange={(e) => setNewDesc((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. A4 PAPERS"
                  style={styles.modalInput}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Size</label>
                <input
                  value={newDesc.size}
                  onChange={(e) => setNewDesc((p) => ({ ...p, size: e.target.value }))}
                  placeholder="e.g. A4, WPCL"
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDesc.price}
                  onChange={(e) => setNewDesc((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={newDesc.openingStock}
                  onChange={(e) => setNewDesc((p) => ({ ...p, openingStock: e.target.value }))}
                  placeholder="0"
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowNewDescModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.addBtn}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '100%', overflowX: 'auto' },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  company: { margin: 0, fontSize: '1.5rem', fontWeight: 700 },
  title: { margin: '8px 0 0', fontSize: '1.1rem', opacity: 0.95 },
  controls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  label: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },
  dateInput: { padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchInput: {
    padding: '10px 36px 10px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    width: 220,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    color: '#64748b',
    padding: 4,
  },
  newDescBtn: {
    padding: '10px 24px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 340,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  modalTitle: { margin: '0 0 20px', fontSize: '1.25rem' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLabel: { fontSize: 14, fontWeight: 600 },
  modalInput: {
    padding: 10,
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14,
  },
  modalButtons: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  addBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  successMsg: { padding: 12, backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 8, marginBottom: 16 },
  errorMsg: { padding: 12, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 16 },
  loading: { padding: 40, textAlign: 'center' },
  tableWrap: { overflowX: 'auto', backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 1200 },
  th: {
    padding: 10,
    backgroundColor: '#334155',
    color: '#fff',
    border: '1px solid #475569',
    fontSize: 12,
    textAlign: 'center',
  },
  thDetail: {
    padding: 10,
    backgroundColor: '#1e3a8a',
    color: '#fff',
    border: '1px solid #475569',
    minWidth: 160,
    textAlign: 'left',
    position: 'sticky',
    left: 0,
    zIndex: 5,
  },
  thIn: { padding: 10, color: '#fff', border: '1px solid #475569', fontSize: 12, textAlign: 'center', backgroundColor: '#2563eb' },
  thOut: { padding: 10, color: '#fff', border: '1px solid #475569', fontSize: 12, textAlign: 'center', backgroundColor: '#dc2626' },
  td: {
    padding: 4,
    border: '1px solid #e2e8f0',
  },
  tdDetail: {
    padding: 8,
    border: '1px solid #e2e8f0',
    fontWeight: 600,
    position: 'sticky',
    left: 0,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  input: {
    width: 56,
    padding: 4,
    textAlign: 'center',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
  },
  empty: { padding: 24, textAlign: 'center', color: '#64748b' },
};
