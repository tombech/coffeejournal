import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import StarRating from './StarRating';

function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [batch, setBatch] = useState(null);
  const [product, setProduct] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBatchDetail();
  }, [id]);

  const fetchBatchDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${id}/detail`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBatch(data.batch);
      setProduct(data.product);
      setStatistics(data.statistics);
      setRecentSessions(data.recent_sessions || []);
    } catch (err) {
      setError("Failed to fetch batch details: " + err.message);
      console.error("Error fetching batch details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...batch,
          is_active: !batch.is_active
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedBatch = await response.json();
      setBatch(updatedBatch);
      addToast(`Batch ${updatedBatch.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      setError("Failed to update batch status: " + err.message);
    }
  };

  const formatDateNorwegian = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  if (loading) return <p className="loading-message">Loading batch details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!batch) return <p>Batch not found.</p>;

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
          Batch #{batch.id}
          {!batch.is_active && <span style={{ marginLeft: '8px', fontSize: '14px', color: '#f44336' }}>⚠️ Inactive</span>}
        </h2>
        {product && (
          <Link 
            to={`/products/${product.id}`}
            style={{ 
              padding: '6px 8px', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              fontSize: '16px',
              textDecoration: 'none'
            }}
            title="View Product"
          >
            🫘
          </Link>
        )}
      </div>

      {/* Product Link */}
      {product && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <strong>Product: </strong>
          <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', fontWeight: 'bold' }}>
            {product.roaster?.name} - {product.product_name}
          </Link>
        </div>
      )}

      {/* Batch Details */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
          <strong>Roast Date:</strong>
          <span>{batch.roast_date ? formatDateNorwegian(batch.roast_date) : 'Unknown'}</span>
          
          <strong>Purchase Date:</strong>
          <span>{batch.purchase_date ? formatDateNorwegian(batch.purchase_date) : '-'}</span>
          
          <strong>Amount:</strong>
          <span>{batch.amount_grams ? `${batch.amount_grams}g` : '-'}</span>
          
          <strong>Price:</strong>
          <span>{batch.price != null && !isNaN(batch.price) ? `${Number(batch.price).toFixed(2)} kr` : '-'}</span>
          
          <strong>Price per Cup:</strong>
          <span>{statistics?.price_per_cup != null && !isNaN(statistics.price_per_cup) ? `${Number(statistics.price_per_cup).toFixed(2)} kr` : '-'}</span>
          
          <strong>Seller:</strong>
          <span>{batch.seller || '-'}</span>
          
          <strong>Rating:</strong>
          <span>
            {batch.rating ? (
              <StarRating rating={batch.rating} readOnly={true} maxRating={5} />
            ) : '-'}
          </span>
          
          <strong>Status:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: batch.is_active ? '#4caf50' : '#f44336' }}>
              {batch.is_active ? 'Active' : 'Inactive'}
            </span>
            <button 
              onClick={handleToggleActive}
              style={{ 
                padding: '4px 8px', 
                backgroundColor: batch.is_active ? '#f44336' : '#4caf50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {batch.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
          
          {batch.notes && (
            <>
              <strong>Notes:</strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{batch.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      {statistics && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📊 Usage Statistics</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.total_brew_sessions}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Brew Sessions</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.total_coffee_used}g</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Coffee Used</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{statistics.coffee_remaining}g</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Remaining</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{statistics.sessions_remaining_estimate}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Est. Sessions Left</div>
            </div>
            
            {statistics.avg_rating && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                  <StarRating rating={statistics.avg_rating} readOnly={true} maxRating={5} />
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Avg Rating</div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {batch.amount_grams > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '5px', color: '#666' }}>
                Usage Progress ({statistics.total_coffee_used}g of {batch.amount_grams}g used)
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e0e0e0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${Math.min(100, (statistics.total_coffee_used / batch.amount_grams) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: statistics.coffee_remaining <= 0 ? '#f44336' : '#4caf50',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Brew Sessions */}
      {recentSessions.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>🔥 Recent Brews</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', whiteSpace: 'nowrap', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Coffee</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Water</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(session => (
                  <tr key={session.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <Link to={`/brew-sessions/${session.id}`} style={{ textDecoration: 'none' }}>
                        {formatDateNorwegian(session.timestamp)}
                      </Link>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.brew_method?.name || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.amount_coffee_grams || '-'}g</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.amount_water_grams || '-'}g</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {session.score ? session.score.toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchDetail;