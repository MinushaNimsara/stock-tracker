import { useState, useEffect } from 'react';
import { api } from '../api/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import logo from '../assets/logo.png';


export default function MonthlyReport() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadReport();
  }, [month]);

  useEffect(() => {
    if (reportData && reportData.data) {
      if (searchTerm.trim() === '') {
        setFilteredData(reportData.data);
      } else {
        const filtered = reportData.data.filter(row =>
          row.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(filtered);
      }
    }
  }, [searchTerm, reportData]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getMonthlyReport(month);
      console.log('Report data:', response.data);
      setReportData(response.data);
      setFilteredData(response.data.data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRowColor = (index) => {
    const colors = [
      '#E3F2FD',
      '#FFE0B2',
      '#C8E6C9',
      '#F3E5F5',
      '#FFF9C4',
    ];
    return colors[index % colors.length];
  };

  const handleDownloadExcel = async () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No data to download');
      return;
    }

    try {
      const zip = new JSZip();
      const allStockCSV = prepareAllStockCSV();
      const purchaseCSV = preparePurchaseCSV();
      const usageCSV = prepareUsageCSV();

      zip.file('1_All_Stock.csv', allStockCSV);
      zip.file('2_Purchase_Records.csv', purchaseCSV);
      zip.file('3_Usage_Records.csv', usageCSV);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `Stock_Report_${month}.zip`);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file');
    }
  };

  const prepareAllStockCSV = () => {
    const headers = [
      'S/N',
      'Description',
      'Opening',
      ...Array.from({ length: 31 }, (_, i) => `P-${i + 1}`),
      ...Array.from({ length: 31 }, (_, i) => `U-${i + 1}`),
      'Total Purchase',
      'Total Usage',
      'Closing Stock'
    ];

    const rows = filteredData.map(row => {
      const purchaseValues = Array.from({ length: 31 }, (_, i) => {
        const key = `purchase_day_${String(i + 1).padStart(2, '0')}`;
        return row[key] || 0;
      });

      const usageValues = Array.from({ length: 31 }, (_, i) => {
        const key = `usage_day_${String(i + 1).padStart(2, '0')}`;
        return row[key] || 0;
      });

      return [
        row.sn,
        `"${row.description}"`,
        row.opening_stock || 0,
        ...purchaseValues,
        ...usageValues,
        row.total_purchase || 0,
        row.total_usage || 0,
        row.closing_stock || 0
      ];
    });

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const preparePurchaseCSV = () => {
    const headers = [
      'S/N',
      'Description',
      'Opening',
      ...Array.from({ length: 31 }, (_, i) => `P-${i + 1}`),
      'Total Purchase',
      'Closing Stock'
    ];

    const rows = filteredData.map(row => {
      const purchaseValues = Array.from({ length: 31 }, (_, i) => {
        const key = `purchase_day_${String(i + 1).padStart(2, '0')}`;
        return row[key] || 0;
      });

      return [
        row.sn,
        `"${row.description}"`,
        row.opening_stock || 0,
        ...purchaseValues,
        row.total_purchase || 0,
        row.closing_stock || 0
      ];
    });

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const prepareUsageCSV = () => {
    const headers = [
      'S/N',
      'Description',
      'Opening',
      ...Array.from({ length: 31 }, (_, i) => `U-${i + 1}`),
      'Total Usage',
      'Closing Stock'
    ];

    const rows = filteredData.map(row => {
      const usageValues = Array.from({ length: 31 }, (_, i) => {
        const key = `usage_day_${String(i + 1).padStart(2, '0')}`;
        return row[key] || 0;
      });

      return [
        row.sn,
        `"${row.description}"`,
        row.opening_stock || 0,
        ...usageValues,
        row.total_usage || 0,
        row.closing_stock || 0
      ];
    });

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const renderTable = () => {
    if (activeTab === 'all') {
      return renderAllStockTable();
    } else if (activeTab === 'purchase') {
      return renderPurchaseTable();
    } else {
      return renderUsageTable();
    }
  };

  const renderAllStockTable = () => (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thStickyCol1 }}>S/N</th>
            <th style={{ ...styles.th, ...styles.thStickyCol2 }}>Description</th>
            <th style={styles.th}>Opening</th>
            {[...Array(31)].map((_, i) => (
              <th key={`p-${i}`} style={styles.thPurchase}>P-{i + 1}</th>
              ))}
            {[...Array(31)].map((_, i) => (
              <th key={`u-${i}`} style={styles.thUsage}>U-{i + 1}</th>
              
              ))}

            <th style={styles.thTotal}>Total Purchase</th>
            <th style={styles.thTotal}>Total Usage</th>
            <th style={styles.thTotal}>Closing Stock</th>
          </tr>
        </thead>
        <tbody>
          {filteredData && filteredData.map((row, idx) => {
            const rowBgColor = getRowColor(idx);
            return (
              <tr key={row.sn}>
                <td style={{ ...styles.td, ...styles.tdStickyCol1, backgroundColor: rowBgColor }}>
                  {row.sn}
                </td>
                <td style={{ ...styles.td, ...styles.tdStickyCol2, backgroundColor: rowBgColor, fontWeight: '600' }}>
                  {row.description}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor }}>
                  {row.opening_stock || 0}
                </td>
                {[...Array(31)].map((_, i) => {
                  const key = `purchase_day_${String(i + 1).padStart(2, '0')}`;
                  const val = row[key];
                  return (
                    <td key={key} style={{ ...styles.td, backgroundColor: rowBgColor }}>
                      {val && val > 0 ? val : '-'}
                    </td>
                  );
                })}
                {[...Array(31)].map((_, i) => {
                  const key = `usage_day_${String(i + 1).padStart(2, '0')}`;
                  const val = row[key];
                  return (
                    <td key={key} style={{ ...styles.td, backgroundColor: rowBgColor }}>
                      {val && val > 0 ? val : '-'}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold' }}>
                  {row.total_purchase || 0}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold' }}>
                  {row.total_usage || 0}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold', color: '#16a34a' }}>
                  {row.closing_stock || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderPurchaseTable = () => (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thStickyCol1 }}>S/N</th>
            <th style={{ ...styles.th, ...styles.thStickyCol2 }}>Description</th>
            <th style={styles.th}>Opening</th>
            {[...Array(31)].map((_, i) => (
              <th key={`p-${i}`} style={styles.thPurchase}>P-{i + 1}</th>
              
              ))}

            <th style={styles.thTotal}>Total Purchase</th>
            <th style={styles.thTotal}>Closing Stock</th>
          </tr>
        </thead>
        <tbody>
          {filteredData && filteredData.map((row, idx) => {
            const rowBgColor = getRowColor(idx);
            return (
              <tr key={row.sn}>
                <td style={{ ...styles.td, ...styles.tdStickyCol1, backgroundColor: rowBgColor }}>
                  {row.sn}
                </td>
                <td style={{ ...styles.td, ...styles.tdStickyCol2, backgroundColor: rowBgColor, fontWeight: '600' }}>
                  {row.description}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor }}>
                  {row.opening_stock || 0}
                </td>
                {[...Array(31)].map((_, i) => {
                  const key = `purchase_day_${String(i + 1).padStart(2, '0')}`;
                  const val = row[key];
                  return (
                    <td key={key} style={{ ...styles.td, backgroundColor: rowBgColor }}>
                      {val && val > 0 ? val : '-'}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold' }}>
                  {row.total_purchase || 0}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold', color: '#16a34a' }}>
                  {row.closing_stock_purchase || 0}
                  
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderUsageTable = () => (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thStickyCol1 }}>S/N</th>
            <th style={{ ...styles.th, ...styles.thStickyCol2 }}>Description</th>
            <th style={styles.th}>Opening</th>
            {[...Array(31)].map((_, i) => (
              <th key={`u-${i}`} style={styles.thUsage}>U-{i + 1}</th>
            ))}

            <th style={styles.thTotal}>Total Usage</th>
            <th style={styles.thTotal}>Closing Stock</th>
          </tr>
        </thead>
        <tbody>
          {filteredData && filteredData.map((row, idx) => {
            const rowBgColor = getRowColor(idx);
            return (
              <tr key={row.sn}>
                <td style={{ ...styles.td, ...styles.tdStickyCol1, backgroundColor: rowBgColor }}>
                  {row.sn}
                </td>
                <td style={{ ...styles.td, ...styles.tdStickyCol2, backgroundColor: rowBgColor, fontWeight: '600' }}>
                  {row.description}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor }}>
                  {row.opening_stock || 0}
                </td>
                {[...Array(31)].map((_, i) => {
                  const key = `usage_day_${String(i + 1).padStart(2, '0')}`;
                  const val = row[key];
                  return (
                    <td key={key} style={{ ...styles.td, backgroundColor: rowBgColor }}>
                      {val && val > 0 ? val : '-'}
                    </td>
                  );
                })}
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold' }}>
                  {row.total_usage || 0}
                </td>
                <td style={{ ...styles.td, backgroundColor: rowBgColor, fontWeight: 'bold', color: '#16a34a' }}>
                  {row.closing_stock_usage || 0}
                  
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Monthly Stock Report</h1>
        <p style={styles.subtitle}>View complete stock transactions and calculations</p>
      </div>

      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <label style={styles.label}>
            📅 Select Month:
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={styles.monthInput}
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
              <button style={styles.clearBtn} onClick={handleClearSearch}>
                ✕
              </button>
            )}
          </div>
        </div>

        <button style={styles.downloadBtn} onClick={handleDownloadExcel}>
          📦 Download ZIP (3 CSV Files)
        </button>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'all' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('all')}
        >
          📋 All Stock
        </button>
        <button
          style={activeTab === 'purchase' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('purchase')}
        >
          📥 Purchase Records
        </button>
        <button
          style={activeTab === 'usage' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('usage')}
        >
          📤 Usage Records
        </button>
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading report data...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredData && filteredData.length > 0 && renderTable()}

      {!loading && !error && filteredData && filteredData.length === 0 && (
        <div style={styles.emptyContainer}>
          <p>No data found for the selected month</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 5px 0',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    opacity: 0.9,
    fontSize: '14px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  controlsLeft: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  monthInput: {
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    padding: '10px 40px 10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    width: '280px',
    fontFamily: 'inherit',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#9ca3af',
    padding: '5px',
  },
  downloadBtn: {
    padding: '12px 24px',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
    transition: 'all 0.3s ease',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
  },
  tableWrapper: {
    overflowX: 'auto',
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: '70vh',
    position: 'relative',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    minWidth: '2000px',
  },
  th: {
    backgroundColor: '#1e3a8a',
    color: 'white',
    padding: '14px 10px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 5,
    whiteSpace: 'nowrap',
  },
  thStickyCol1: {
    position: 'sticky',
    left: 0,
    zIndex: 15,
    backgroundColor: '#1e3a8a',
    minWidth: '50px',
    borderRight: '2px solid rgba(255,255,255,0.3)',
  },
  thStickyCol2: {
    position: 'sticky',
    left: '50px',
    zIndex: 15,
    backgroundColor: '#1e3a8a',
    minWidth: '200px',
    textAlign: 'left',
    paddingLeft: '15px',
    borderRight: '2px solid rgba(255,255,255,0.3)',
  },
  thTotal: {
    backgroundColor: '#15803d',
    color: 'white',
    padding: '14px 10px',
    textAlign: 'center',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 5,
  },
  thPurchase: {
    backgroundColor: '#2563eb', // Blue for Purchase
    color: 'white',
    padding: '14px 10px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 5,
    whiteSpace: 'nowrap',
  },
  thUsage: {
    backgroundColor: '#dc2626', // Red for Usage
    color: 'white',
    padding: '14px 10px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 5,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 10px',
    textAlign: 'center',
    borderRight: '1px solid rgba(0,0,0,0.05)',
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    color: '#1f2937',
  },
  tdStickyCol1: {
    position: 'sticky',
    left: 0,
    zIndex: 10,
    minWidth: '50px',
    fontWeight: '600',
    borderRight: '2px solid rgba(0,0,0,0.15)',
  },
  tdStickyCol2: {
    position: 'sticky',
    left: '50px',
    zIndex: 10,
    minWidth: '200px',
    textAlign: 'left',
    paddingLeft: '15px',
    borderRight: '2px solid rgba(0,0,0,0.15)',
    color: '#1f2937',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #e5e7eb',
    borderTop: '5px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    padding: '30px',
    backgroundColor: '#fee',
    color: '#c62828',
    borderRadius: '12px',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: '50px',
    backgroundColor: 'white',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '16px',
  },
};
