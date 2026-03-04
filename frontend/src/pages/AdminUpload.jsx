import { useState } from 'react';
import { api } from '../api/client';

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!file) {
      setError('Please select a CSV or Excel file');
      return;
    }
    setLoading(true);
    try {
      const res = await api.uploadStoreList(file);
      setResult(res.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Upload Store List</h2>
      <p style={styles.subtitle}>
        Upload a CSV or Excel (.xlsx) file with <b>Description</b> and <b>Opening Stock</b> columns.
        If a description exists, its opening stock is updated; otherwise a new one is created.
        Accepted column names: Description/Name/Item, Opening Stock/Stock/Qty.
      </p>
      <p style={styles.sample}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const csv = 'Description,Opening Stock\nSample Item 1,100\nSample Item 2,50';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'store_list_sample.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={styles.sampleLink}
        >
          Download sample CSV
        </a>
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>CSV or Excel File</label>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={styles.fileInput}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Uploading...' : 'Upload & Update'}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
      {result && (
        <div style={styles.result}>
          <p style={styles.success}>Store list processed successfully.</p>
          <p>Updated: {result.updated} | Created: {result.created}</p>
          {result.errors?.length > 0 && (
            <ul style={styles.errorList}>
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: 560,
    margin: '0 auto',
    padding: 24,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  title: { margin: '0 0 8px 0', color: '#111827', fontSize: '1.5rem' },
  subtitle: { margin: '0 0 8px 0', color: '#4b5563', fontSize: 14 },
  sample: { margin: '0 0 20px 0', fontSize: 13 },
  sampleLink: { color: '#1d4ed8', textDecoration: 'underline' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 600, color: '#374151', fontSize: 14 },
  input: {
    padding: 10,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
  },
  fileInput: { padding: 8, fontSize: 14 },
  btn: {
    padding: '12px 20px',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: { color: '#b91c1c', marginTop: 16, fontWeight: 600 },
  result: { marginTop: 20, padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' },
  success: { color: '#15803d', fontWeight: 600, margin: '0 0 8px 0' },
  errorList: { margin: '8px 0 0 0', paddingLeft: 20, color: '#b45309', fontSize: 13 },
};
