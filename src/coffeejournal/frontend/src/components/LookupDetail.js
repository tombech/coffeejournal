import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';

function LookupDetail({ type, singularName, pluralName }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [item, setItem] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItemDetail();
  }, [id, type]);

  const fetchItemDetail = async () => {
    setLoading(true);
    try {
      const [itemResponse, usageResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/${type}/${id}`),
        fetch(`${API_BASE_URL}/${type}/${id}/usage`)
      ]);
      
      if (!itemResponse.ok) {
        throw new Error(`HTTP error! status: ${itemResponse.status}`);
      }
      
      const itemData = await itemResponse.json();
      setItem(itemData);
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageData(usageData);
      }
    } catch (err) {
      setError(`Failed to fetch ${singularName.toLowerCase()} details: ` + err.message);
      console.error(`Error fetching ${singularName.toLowerCase()} details:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}/${id}/set_default`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      addToast(`Set as default ${singularName.toLowerCase()}`, 'success');
      fetchItemDetail(); // Refresh data
    } catch (err) {
      setError(`Failed to set default: ${err.message}`);
    }
  };

  const handleClearDefault = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}/${id}/clear_default`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      addToast(`Cleared default ${singularName.toLowerCase()}`, 'success');
      fetchItemDetail(); // Refresh data
    } catch (err) {
      setError(`Failed to clear default: ${err.message}`);
    }
  };

  if (loading) return <p className="loading-message">Loading {singularName.toLowerCase()} details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!item) return <p>{singularName} not found.</p>;

  return (
    <div>
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px'
          }}
          title="Go Back"
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, marginRight: 'auto' }}>
          {item.name}
          {item.is_default && <span style={{ marginLeft: '8px', fontSize: '14px', color: '#1976d2' }}>⭐ Default</span>}
        </h2>
        <Link 
          to={`/settings/${type}`}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            textDecoration: 'none'
          }}
          title={`Manage ${pluralName}`}
        >
          ⚙️
        </Link>
      </div>

      {/* Item Details */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
          <strong>Name:</strong>
          <span>{item.name}</span>
          
          {item.short_form && (
            <>
              <strong>Short Form:</strong>
              <span>{item.short_form}</span>
            </>
          )}
          
          {item.description && (
            <>
              <strong>Description:</strong>
              <span>{item.description}</span>
            </>
          )}
          
          {item.url && (
            <>
              <strong>Website:</strong>
              <span>
                <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url}</a>
              </span>
            </>
          )}
          
          {item.notes && (
            <>
              <strong>Notes:</strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</span>
            </>
          )}
          
          <strong>Default:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{item.is_default ? 'Yes' : 'No'}</span>
            {item.is_default ? (
              <button 
                onClick={handleClearDefault}
                style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#f44336', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear Default
              </button>
            ) : (
              <button 
                onClick={handleSetDefault}
                style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#1976d2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Set as Default
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      {usageData && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📊 Usage Statistics</h3>
          
          {usageData.usage_count > 0 ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{usageData.usage_count}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Times Used in Brew Sessions</div>
              </div>
              
              {usageData.recent_usage && usageData.recent_usage.length > 0 && (
                <div>
                  <h4 style={{ margin: '15px 0 10px 0', fontSize: '14px' }}>Recent Usage:</h4>
                  <div style={{ fontSize: '12px' }}>
                    {usageData.recent_usage.slice(0, 5).map((usage, index) => (
                      <div key={index} style={{ marginBottom: '5px', color: '#666' }}>
                        • {new Date(usage.timestamp).toLocaleDateString()} - {usage.product_name || 'Unknown Product'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              This {singularName.toLowerCase()} has not been used in any brew sessions yet.
            </p>
          )}
        </div>
      )}

      {/* Item Image */}
      {item.image_url && (
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <img 
            src={item.image_url} 
            alt={item.name} 
            style={{ 
              maxWidth: '300px', 
              maxHeight: '300px', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }} 
          />
        </div>
      )}
    </div>
  );
}

export default LookupDetail;