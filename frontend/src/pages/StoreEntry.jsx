import { useState, useEffect } from 'react';
import { api } from '../api/client';
import logo from '../assets/logo.png';

export default function StoreEntry() {
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description_id: '',
    color_id: '',
    purchase_qty: 0,
    usage_qty: 0,
    reason: '',
  });

  const [descriptionSearch, setDescriptionSearch] = useState('');
  const [showDescDropdown, setShowDescDropdown] = useState(false);
  const [descriptions, setDescriptions] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showNewDescModal, setShowNewDescModal] = useState(false);

  // Purchase modal state
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [selectedPurchaseDesc, setSelectedPurchaseDesc] = useState(null);

  // New Description modal state
  const [newDescSearch, setNewDescSearch] = useState('');
  const [newDescOpeningStock, setNewDescOpeningStock] = useState('');

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [descRes, colorRes] = await Promise.all([
        api.getDescriptions(),
        api.getColors(),
      ]);

      setDescriptions(descRes.data);
      setColors(colorRes.data);

      if (colorRes.data.length > 0) {
        const whiteColor = colorRes.data.find((c) => c.name === 'White');
        if (whiteColor) {
          setFormData((prev) => ({ ...prev, color_id: whiteColor.id }));
        }
      }
    } catch (error) {
      console.error('Error loading dropdowns:', error);
      setMessage('⚠️ Error loading data. Check backend.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('_qty') || name.includes('_id') ? Number(value) || 0 : value,
    }));
  };

  // ==================== PURCHASE MODAL ====================
  const openPurchaseModal = () => {
    setPurchaseSearch('');
    setPurchaseQty('');
    setSelectedPurchaseDesc(null);
    setShowPurchaseModal(true);
  };

  const closePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  const handlePurchaseSelect = (desc) => {
    setSelectedPurchaseDesc(desc);
    setPurchaseSearch(desc.name);
  };

  const handlePurchaseAdd = () => {
    if (!selectedPurchaseDesc) {
      alert('Please select a description');
      return;
    }
    if (!purchaseQty || Number(purchaseQty) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      description_id: selectedPurchaseDesc.id,
      purchase_qty: Number(purchaseQty),
    }));

    setMessage(`✅ Purchase: ${selectedPurchaseDesc.name} - Qty: ${purchaseQty}`);
    closePurchaseModal();
  };

  const filteredPurchaseDescs = descriptions.filter((d) =>
    d.name.toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  // ==================== NEW DESCRIPTION MODAL ====================
  const openNewDescModal = () => {
    setNewDescSearch('');
    setNewDescOpeningStock('');
    setShowNewDescModal(true);
  };

  const closeNewDescModal = () => {
    setShowNewDescModal(false);
  };

  const handleNewDescAdd = async () => {
    if (!newDescSearch.trim()) {
      alert('Please enter description name');
      return;
    }

    const duplicate = descriptions.find(
      (d) => d.name.toLowerCase() === newDescSearch.toLowerCase()
    );
    if (duplicate) {
      alert(`Description "${duplicate.name}" already exists!`);
      return;
    }

    try {
      const dataToSend = {
        name: newDescSearch.trim(),
        opening_stock: newDescOpeningStock === '' ? 0 : Number(newDescOpeningStock),
        active: true,
      };

      const response = await api.createDescription(dataToSend);
      setDescriptions((prev) => [...prev, response.data]);
      setFormData((prev) => ({
        ...prev,
        description_id: response.data.id,
      }));

      setMessage(`✅ Description "${response.data.name}" added successfully!`);
      closeNewDescModal();
    } catch (error) {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const filteredNewDescs = descriptions.filter((d) =>
    d.name.toLowerCase().includes(newDescSearch.toLowerCase())
  );
  const isNewDescNotFound = newDescSearch.trim() && filteredNewDescs.length === 0;

  // ==================== MAIN FORM SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description_id || !formData.color_id) {
      setMessage('⚠️ Please select Description and Color');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.createStockEntry(formData);
      setMessage(`✅ Entry saved successfully! ID: ${response.data.id}`);

      // Reset form
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        description_id: '',
        color_id: colors.find((c) => c.name === 'White')?.id || '',
        purchase_qty: 0,
        usage_qty: 0,
        reason: '',
      });
      setDescriptionSearch('');
    } catch (error) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedDesc = descriptions.find((d) => d.id === formData.description_id);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>📦 Store Entry</h1>
            <p style={styles.subtitle}>Record daily A4 format stock transactions</p>
          </div>
          <div style={styles.actionButtons}>
            <button
              type="button"
              onClick={openPurchaseModal}
              style={styles.quickBtn}
            >
              🚀 Quick Purchase
            </button>
            <button
              type="button"
              onClick={openNewDescModal}
              style={styles.newDescBtn}
            >
              ➕ New Description
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={message.startsWith('✅') ? styles.successMsg : styles.errorMsg}>
          {message}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>📋 Entry Details</h2>

          {/* Date */}
          <div style={styles.field}>
            <label style={styles.label}>📅 Date</label>
            <input
              type="date"
              name="entry_date"
              value={formData.entry_date}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Description - Searchable Dropdown */}
          <div style={styles.field}>
            <label style={styles.label}>
              📝 Description <span style={styles.required}>*</span>
            </label>

            {/* Search Input */}
            <input
              type="text"
              value={descriptionSearch}
              onChange={(e) => {
                setDescriptionSearch(e.target.value);
                setShowDescDropdown(true);
                if (!e.target.value) {
                  setFormData((prev) => ({ ...prev, description_id: '' }));
                }
              }}
              onFocus={() => setShowDescDropdown(true)}
              placeholder="Type to search... (e.g., PACKING)"
              style={styles.input}
            />

            {/* Dropdown Results */}
            {showDescDropdown && descriptionSearch && (
              <div style={styles.descriptionDropdown}>
                {descriptions
                  .filter((d) =>
                    d.name.toLowerCase().includes(descriptionSearch.toLowerCase())
                  )
                  .map((desc) => (
                    <div
                      key={desc.id}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, description_id: desc.id }));
                        setDescriptionSearch(desc.name);
                        setShowDescDropdown(false);
                      }}
                      style={styles.dropdownItem}
                    >
                      {desc.name}
                    </div>
                  ))}
                {descriptions.filter((d) =>
                  d.name.toLowerCase().includes(descriptionSearch.toLowerCase())
                ).length === 0 && <div style={styles.noResults}>No results found</div>}
              </div>
            )}

            {/* Selected Description Display */}
            {formData.description_id && !showDescDropdown && (
              <div style={styles.selectedDesc}>
                ✅ Selected:{' '}
                <strong>
                  {descriptions.find((d) => d.id === formData.description_id)?.name}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, description_id: '' }));
                    setDescriptionSearch('');
                  }}
                  style={styles.clearBtn}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* A4 Color */}
          <div style={styles.field}>
            <label style={styles.label}>🎨 A4 Color</label>
            <select
              name="color_id"
              value={formData.color_id}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Color</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          {/* Purchase & Usage Quantities - MUTUAL EXCLUSION */}
          <div style={styles.qtyRow}>
            {/* Purchase Qty - Disabled if Usage Qty > 0 */}
            <div style={styles.qtyField}>
              <label style={styles.label}>📦 Purchase Qty</label>
              <input
                type="number"
                name="purchase_qty"
                value={formData.purchase_qty}
                onChange={handleChange}
                min="0"
                disabled={formData.usage_qty > 0}
                style={{
                  ...styles.input,
                  ...(formData.usage_qty > 0 ? styles.inputDisabled : {}),
                }}
              />
              {formData.usage_qty > 0 && (
                <small style={styles.disabledNote}>
                  ⚠️ Disabled (Usage Qty entered)
                </small>
              )}
            </div>

            {/* Usage Qty - Always Enabled */}
            <div style={styles.qtyField}>
              <label style={styles.label}>📤 Usage Qty</label>
              <input
                type="number"
                name="usage_qty"
                value={formData.usage_qty}
                onChange={handleChange}
                min="0"
                style={styles.input}
              />
            </div>
          </div>

          {/* Reason */}
          <div style={styles.field}>
            <label style={styles.label}>💬 Reason (Optional)</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="e.g., New stock received, Daily usage"
              rows="3"
              style={styles.textarea}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? '⏳ Saving...' : '💾 Save Entry'}
          </button>
        </div>
      </form>

      {/* ==================== QUICK PURCHASE MODAL ==================== */}
      {showPurchaseModal && (
        <div style={styles.modalOverlay} onClick={closePurchaseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🚀 Quick Purchase Entry</h2>

            {/* Search Description */}
            <div style={styles.field}>
              <label style={styles.label}>Search Description</label>
              <input
                type="text"
                value={purchaseSearch}
                onChange={(e) => {
                  setPurchaseSearch(e.target.value);
                  setSelectedPurchaseDesc(null);
                }}
                placeholder="Type to search... (e.g., PACKING)"
                style={styles.input}
                autoFocus
              />
            </div>

            {/* Description List */}
            {purchaseSearch && !selectedPurchaseDesc && (
              <div style={styles.searchResults}>
                {filteredPurchaseDescs.length > 0 ? (
                  filteredPurchaseDescs.map((desc) => (
                    <div
                      key={desc.id}
                      onClick={() => handlePurchaseSelect(desc)}
                      style={styles.searchItem}
                    >
                      {desc.name}
                    </div>
                  ))
                ) : (
                  <div style={styles.noResults}>No results found</div>
                )}
              </div>
            )}

            {/* Purchase Quantity */}
            <div style={styles.field}>
              <label style={styles.label}>📦 Purchase Qty</label>
              <input
                type="number"
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(e.target.value)}
                min="0"
                placeholder="0"
                style={styles.input}
              />
            </div>

            {/* Buttons */}
            <div style={styles.modalButtons}>
              <button
                type="button"
                onClick={closePurchaseModal}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchaseAdd}
                style={styles.addBtn}
              >
                Add Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NEW DESCRIPTION MODAL ==================== */}
      {showNewDescModal && (
        <div style={styles.modalOverlay} onClick={closeNewDescModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>➕ Add New Description</h2>

            {/* Search/Create Description */}
            <div style={styles.field}>
              <label style={styles.label}>Description Name</label>
              <input
                type="text"
                value={newDescSearch}
                onChange={(e) => setNewDescSearch(e.target.value)}
                placeholder="Type description name..."
                style={styles.input}
                autoFocus
              />
            </div>

            {/* Existing Descriptions */}
            {newDescSearch && !isNewDescNotFound && (
              <div style={styles.searchResults}>
                {filteredNewDescs.map((desc) => (
                  <div key={desc.id} style={styles.existingItem}>
                    ✅ {desc.name} (Already exists)
                  </div>
                ))}
              </div>
            )}

            {/* New Description Found */}
            {isNewDescNotFound && (
              <>
                <div style={styles.newDescInfo}>
                  ✨ Create new: <strong>{newDescSearch}</strong>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Opening Stock (Optional)</label>
                  <input
                    type="number"
                    value={newDescOpeningStock}
                    onChange={(e) => setNewDescOpeningStock(e.target.value)}
                    min="0"
                    placeholder="0"
                    style={styles.input}
                  />
                </div>
              </>
            )}

            {/* Buttons */}
            <div style={styles.modalButtons}>
              <button
                type="button"
                onClick={closeNewDescModal}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNewDescAdd}
                disabled={!isNewDescNotFound}
                style={{
                  ...styles.addBtn,
                  ...(isNewDescNotFound ? {} : styles.addBtnDisabled),
                }}
              >
                Create Description
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '2rem',
    fontWeight: '700',
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#bfdbfe',
    fontSize: '1rem',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  quickBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
  },
  newDescBtn: {
    padding: '10px 20px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
  },
  successMsg: {
    padding: '16px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  errorMsg: {
    padding: '16px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formSection: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#000',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff',
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#fff',
    color: '#000',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'vertical',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    color: '#000',
  },
  qtyRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  qtyField: {
    display: 'flex',
    flexDirection: 'column',
  },
  disabledNote: {
    display: 'block',
    marginTop: '4px',
    color: '#f59e0b',
    fontSize: '0.85rem',
    fontStyle: 'italic',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  descriptionDropdown: {
    position: 'absolute',
    zIndex: 100,
    maxHeight: '200px',
    overflow: 'auto',
    backgroundColor: '#fff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    marginTop: '4px',
    width: 'calc(100% - 48px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  dropdownItem: {
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #e2e8f0',
    color: '#000',
    transition: 'background-color 0.2s',
  },
  selectedDesc: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: '#dbeafe',
    borderRadius: '6px',
    color: '#1e40af',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
  },
  searchResults: {
    maxHeight: '200px',
    overflow: 'auto',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '16px',
    backgroundColor: '#fff',
  },
  searchItem: {
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
    color: '#000',
  },
  existingItem: {
    padding: '12px',
    borderBottom: '1px solid #e2e8f0',
    color: '#64748b',
  },
  noResults: {
    padding: '16px',
    textAlign: 'center',
    color: '#94a3b8',
  },
  newDescInfo: {
    padding: '12px',
    backgroundColor: '#dbeafe',
    borderRadius: '8px',
    marginBottom: '16px',
    color: '#1e40af',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#64748b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addBtnDisabled: {
    backgroundColor: '#cbd5e1',
    cursor: 'not-allowed',
  },
};
