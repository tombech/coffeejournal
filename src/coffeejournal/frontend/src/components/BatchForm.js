import React, { useState, useEffect } from 'react';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';

function BatchForm({ productId, initialData, onBatchSubmitted, onCancel }) {
  const [formData, setFormData] = useState({
    roast_date: '',
    purchase_date: '',
    amount_grams: '',
    price: '',
    seller: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditMode = !!initialData;
  const { addToast } = useToast();

  useEffect(() => {
    if (initialData) {
      // Convert dates to proper format for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      setFormData({
        roast_date: formatDateForInput(initialData.roast_date),
        purchase_date: formatDateForInput(initialData.purchase_date),
        amount_grams: initialData.amount_grams || '',
        price: initialData.price || '',
        seller: initialData.seller || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode 
      ? `${API_BASE_URL}/batches/${initialData.id}` 
      : `${API_BASE_URL}/batches`;

    // Prepare request data - include product_id for new batches
    const requestData = isEditMode 
      ? formData 
      : { ...formData, product_id: parseInt(productId) };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      addToast(`Batch ${isEditMode ? 'updated' : 'added'} successfully!`, 'success');
      onBatchSubmitted(); // Callback to refresh the batch list
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'add'} batch: ` + err.message);
      console.error("Error submitting batch:", err);
    } finally {
      setLoading(false);
    }
  };

  // Norwegian date formatting for display
  const formatDateNorwegian = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Calculate price per cup in real-time
  const calculatePricePerCup = () => {
    if (formData.price && formData.amount_grams && formData.amount_grams > 0) {
      const cupsPerBatch = formData.amount_grams / 18.0; // 18g per cup
      return (formData.price / cupsPerBatch).toFixed(2);
    }
    return null;
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: isEditMode ? '#fff3cd' : '#f8f9fa', 
      borderRadius: '8px', 
      border: isEditMode ? '1px solid #ffeaa7' : '1px solid #ddd',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: 0 }}>
          {isEditMode ? `Edit Batch #${initialData.id}` : 'Add New Batch'}
        </h4>
        {onCancel && (
          <button 
            onClick={onCancel}
            style={{ 
              padding: '6px 8px', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              fontSize: '16px' 
            }}
            title="Cancel"
          >
            ❌
          </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <label>
            Roast Date:
            <input 
              type="date" 
              name="roast_date" 
              value={formData.roast_date} 
              onChange={handleChange} 
              required 
            />
          </label>
          
          <label>
            Purchase Date:
            <input 
              type="date" 
              name="purchase_date" 
              value={formData.purchase_date} 
              onChange={handleChange} 
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <label>
            Amount (grams):
            <input 
              type="number" 
              name="amount_grams" 
              value={formData.amount_grams} 
              onChange={handleChange} 
              min="1" 
              step="0.1"
              placeholder="250"
            />
          </label>
          
          <label>
            Price (kr):
            <input 
              type="number" 
              name="price" 
              value={formData.price} 
              onChange={handleChange} 
              min="0" 
              step="0.01"
              placeholder="149.00"
            />
          </label>
          
          <label>
            Price per Cup:
            <input 
              type="text" 
              value={calculatePricePerCup() ? `${calculatePricePerCup()} kr` : '-'} 
              disabled 
              style={{ backgroundColor: '#e9ecef' }}
              title="Automatically calculated based on 18g per cup"
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Seller:
            <input 
              type="text" 
              name="seller" 
              value={formData.seller} 
              onChange={handleChange}
              placeholder="e.g., Local coffee shop, Online store"
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            Notes:
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              rows="3"
              placeholder="Any additional notes about this batch..."
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '8px 12px', 
              border: 'none', 
              background: 'none', 
              cursor: loading ? 'default' : 'pointer', 
              fontSize: '18px',
              opacity: loading ? 0.5 : 1
            }}
            title={loading ? 'Saving...' : (isEditMode ? 'Update Batch' : 'Add Batch')}
          >
            {loading ? '⏳' : (isEditMode ? '💾' : '➕')}
          </button>
          
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={loading}
              style={{ 
                padding: '8px 12px', 
                border: 'none', 
                background: 'none', 
                cursor: loading ? 'default' : 'pointer', 
                fontSize: '18px',
                opacity: loading ? 0.5 : 1
              }}
              title="Cancel"
            >
              ❌
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BatchForm;