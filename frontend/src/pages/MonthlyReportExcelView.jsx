import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const MonthlyReportExcelView = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [descriptions, setDescriptions] = useState([]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  useEffect(() => {
    fetchDescriptions();
  }, []);

  useEffect(() => {
    if (selectedMonth && descriptions.length > 0) {
      generateReport();
    }
  }, [selectedMonth, descriptions]);

  const fetchDescriptions = async () => {
    try {
      const data = await api.getDescriptions();
      setDescriptions(data.filter(d => d.active));
    } catch (error) {
      console.error('Error fetching descriptions:', error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const response = await api.getMonthlyReport(year, month);
      
      // Process data for Excel-like view
      const processedData = processReportData(response, year, month);
      setReportData(processedData);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (entries, year, month) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const dateRange = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Create table structure
    const tableData = descriptions.map(desc => {
      const row = {
        sn: desc.id,
        description: desc.name,
        opening: desc.opening_stock || 0,
        purchase: 0,
        usage: 0,
        balance: desc.opening_stock || 0,
        dailyUsage: {},
      };

      // Initialize daily columns
      dateRange.forEach(day => {
        row.dailyUsage[day] = 0;
      });

      // Fill daily data
      entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate.getMonth() + 1 === month && entryDate.getFullYear() === year) {
          const day = entryDate.getDate();
          if (entry.description_id === desc.id) {
            row.dailyUsage[day] = (row.dailyUsage[day] || 0) + entry.usage_qty;
            row.usage += entry.usage_qty;
          }
          if (entry.description_id === desc.id && entry.reason === 'New stock received') {
            row.purchase += entry.purchase_qty;
          }
        }
      });

      // Calculate balance
      row.balance = row.opening + row.purchase - row.usage;
      return row;
    });

    return { dateRange, tableData };
  };

  const downloadExcel = async () => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      await api.downloadMonthlyReportExcel(year, month);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file');
    }
  };

  const styles = {
    container: {
        padding: '1.5rem',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
    },
    controls: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
    },
    input: {
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #444',
      backgroundColor: '#2a2a2a',
      color: '#fff',
      fontSize: '14px',
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    buttonSecondary: {
      padding: '8px 16px',
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    tableWrapper: {
      overflowX: 'auto',
      backgroundColor: '#2a2a2a',
      borderRadius: '6px',
      border: '1px solid #444',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
      minWidth: '1200px',
    },
    th: {
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '12px 8px',
      textAlign: 'center',
      borderRight: '1px solid #444',
      borderBottom: '2px solid #444',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      whiteSpace: 'nowrap',
    },
    thLeft: {
      textAlign: 'left',
      backgroundColor: '#1a1a1a',
      position: 'sticky',
      left: 0,
      zIndex: 11,
    },
    td: {
      padding: '10px 8px',
      borderRight: '1px solid #444',
      borderBottom: '1px solid #333',
      textAlign: 'center',
    },
    tdLeft: {
      textAlign: 'left',
      position: 'sticky',
      left: 0,
      backgroundColor: '#2a2a2a',
      zIndex: 9,
      fontWeight: '500',
    },
    tdNumber: {
      textAlign: 'right',
    },
    tr: {
      backgroundColor: '#2a2a2a',
    },
    trAlt: {
      backgroundColor: '#252525',
    },
    trTotal: {
      backgroundColor: '#1a1a1a',
      fontWeight: 'bold',
      borderTop: '2px solid #444',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
      fontSize: '16px',
      color: '#aaa',
    },
    emptyContainer: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#aaa',
      fontSize: '16px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading report data...</div>
      </div>
    );
  }

  const { dateRange = [], tableData = [] } = reportData;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Monthly Stock Report (Excel View)</h1>
        <div style={styles.controls}>
          <label>
            <span style={{ marginRight: '10px' }}>Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.input}
            />
          </label>
          <button onClick={downloadExcel} style={styles.buttonSecondary}>
            ⬇️ Download Excel
          </button>
        </div>
      </div>

      {tableData.length === 0 ? (
        <div style={styles.emptyContainer}>
          No data available for the selected month
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tr}>
                <th style={{ ...styles.th, ...styles.thLeft, width: '50px' }}>S/N</th>
                <th style={{ ...styles.th, ...styles.thLeft, width: '200px' }}>Description</th>
                <th style={styles.th}>Opening</th>
                <th style={styles.th}>Purchase</th>
                {dateRange.map(day => (
                  <th key={day} style={styles.th}>
                    {day}
                  </th>
                ))}
                <th style={styles.th}>Usage</th>
                <th style={styles.th}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={row.sn} style={rowIndex % 2 === 0 ? styles.tr : styles.trAlt}>
                  <td style={{ ...styles.td, ...styles.tdLeft }}>{rowIndex + 1}</td>
                  <td style={{ ...styles.td, ...styles.tdLeft }}>{row.description}</td>
                  <td style={{ ...styles.td, ...styles.tdNumber }}>{row.opening}</td>
                  <td style={{ ...styles.td, ...styles.tdNumber }}>{row.purchase}</td>
                  {dateRange.map(day => (
                    <td key={day} style={{ ...styles.td, ...styles.tdNumber }}>
                      {row.dailyUsage[day] > 0 ? row.dailyUsage[day] : '-'}
                    </td>
                  ))}
                  <td style={{ ...styles.td, ...styles.tdNumber, fontWeight: 'bold', color: '#ff9800' }}>
                    {row.usage}
                  </td>
                  <td style={{ ...styles.td, ...styles.tdNumber, fontWeight: 'bold', color: '#4CAF50' }}>
                    {row.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportExcelView;
