import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useToast } from './Toast';
import DeleteConfirmationModal from './DeleteConfirmationModal';

function LookupManager({ 
  title, 
  apiEndpoint, 
  singularName, 
  onNavigateBack,
  fields = [] // Array of field definitions: [{name, label, type, required}]
}) {
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);

  // Default fields that all lookup items have
  const defaultFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'short_form', label: 'Short Form', type: 'text', required: false },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false },
    { name: 'product_url', label: 'Product URL', type: 'url', required: false },
    { name: 'image_url', label: 'Image URL', type: 'url', required: false },
    { name: 'icon', label: 'Icon File', type: 'file', required: false }
  ];

  const allFields = [...defaultFields, ...fields];

  const initializeFormData = () => {
    const initialData = {};
    allFields.forEach(field => {
      initialData[field.name] = '';
    });
    return initialData;
  };

  useEffect(() => {
    fetchItems();
  }, [apiEndpoint]);

  useEffect(() => {
    if (editingItem) {
      setFormData({ ...editingItem });
    } else {
      setFormData(initializeFormData());
    }
  }, [editingItem]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${apiEndpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(`Failed to fetch ${title.toLowerCase()}: ` + err.message);
      console.error(`Error fetching ${title}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate required fields
    for (const field of allFields) {
      if (field.required && !formData[field.name]?.trim()) {
        addToast(`${field.label} is required`, 'error');
        setSubmitting(false);
        return;
      }
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `${API_BASE_URL}/${apiEndpoint}/${editingItem.id}`
        : `${API_BASE_URL}/${apiEndpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      addToast(`${singularName} ${editingItem ? 'updated' : 'created'} successfully!`, 'success');
      setShowForm(false);
      setEditingItem(null);
      setFormData(initializeFormData());
      fetchItems();
    } catch (err) {
      addToast(`Failed to ${editingItem ? 'update' : 'create'} ${singularName.toLowerCase()}: ` + err.message, 'error');
      console.error(`Error submitting ${singularName}:`, err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    setItemToDelete(item);
    
    // Check if item is in use
    try {
      const usageUrl = `${API_BASE_URL}/${apiEndpoint}/${item.id}/usage`;
      console.log('Checking usage at:', usageUrl);
      
      const response = await fetch(usageUrl);
      console.log('Usage check response:', response.status, response.statusText);
      
      if (response.ok) {
        const usage = await response.json();
        console.log('Usage info received:', usage);
        setUsageInfo(usage);
      } else {
        console.warn('Usage endpoint returned error:', response.status, response.statusText);
        // If usage endpoint doesn't exist, assume it's not in use
        setUsageInfo({ in_use: false, usage_count: 0, usage_type: null });
      }
      setShowDeleteModal(true);
    } catch (err) {
      // If usage check fails, proceed with simple confirmation
      console.error('Usage check failed, proceeding with simple delete:', err);
      setUsageInfo({ in_use: false, usage_count: 0, usage_type: null });
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirmed = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${apiEndpoint}/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      addToast(`${singularName} deleted successfully!`, 'success');
      fetchItems();
    } catch (err) {
      addToast(`Failed to delete ${singularName.toLowerCase()}: ` + err.message, 'error');
      console.error(`Error deleting ${singularName}:`, err);
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setUsageInfo(null);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      // Handle file upload (we'll just store the filename for now)
      setFormData(prev => ({ ...prev, [name]: files[0]?.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const renderField = (field) => {
    const { name, label, type, required } = field;
    const value = formData[name] || '';

    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            required={required}
            rows="3"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
      case 'file':
        return (
          <input
            type="file"
            name={name}
            onChange={handleChange}
            accept="image/*"
            style={{ width: '100%', padding: '8px' }}
          />
        );
      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            required={required}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        );
    }
  };

  if (loading) return <p>Loading {title.toLowerCase()}...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{title}</h2>
        <div>
          <button 
            onClick={() => setShowForm(!showForm)}
            title={showForm ? 'Cancel' : `Add ${singularName}`}
            style={{ 
              marginRight: '10px',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showForm ? '❌' : '➕'}
          </button>
          <button 
            onClick={onNavigateBack}
            title="Back to Settings"
            style={{ 
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ⬅️
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>{editingItem ? `Edit ${singularName}` : `Add New ${singularName}`}</h3>
          <form onSubmit={handleSubmit}>
            {allFields.map(field => (
              <div key={field.name} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {field.label}{field.required && ' *'}:
                </label>
                {renderField(field)}
              </div>
            ))}
            <div style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                disabled={submitting}
                title={submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                style={{ 
                  padding: '10px 15px',
                  border: 'none',
                  background: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '20px',
                  marginRight: '10px',
                  opacity: submitting ? 0.5 : 1
                }}
              >
                {submitting ? '⏳' : (editingItem ? '💾' : '📝')}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData(initializeFormData());
                }}
                title="Cancel"
                style={{ 
                  padding: '10px 15px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ❌
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Short Form</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.short_form || '-'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {item.description ? (
                    <span title={item.description}>
                      {item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleEdit(item)}
                    title="Edit"
                    style={{ 
                      marginRight: '5px',
                      padding: '2px 4px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(item)}
                    title="Delete"
                    style={{ 
                      padding: '2px 4px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            No {title.toLowerCase()} found. Add one to get started!
          </p>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        item={itemToDelete}
        itemType={singularName}
        apiEndpoint={apiEndpoint}
        usageInfo={usageInfo}
        onDeleteConfirmed={handleDeleteConfirmed}
        availableReplacements={items}
      />
    </div>
  );
}

export default LookupManager;