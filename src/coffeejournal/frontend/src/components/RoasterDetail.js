import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';
import StarRating from './StarRating';

function RoasterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [roaster, setRoaster] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoasterDetail();
  }, [id]);

  const fetchRoasterDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/roasters/${id}/detail`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoaster(data.roaster);
      setStatistics(data.statistics);
      setRecentProducts(data.recent_products || []);
      setRecentSessions(data.recent_sessions || []);
    } catch (err) {
      setError("Failed to fetch roaster details: " + err.message);
      console.error("Error fetching roaster details:", err);
    } finally {
      setLoading(false);
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

  if (loading) return <p className="loading-message">Loading roaster details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!roaster) return <p>Roaster not found.</p>;

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
        <h2 style={{ margin: 0, marginRight: 'auto' }}>{roaster.name}</h2>
        <Link 
          to={`/settings/roasters`}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            textDecoration: 'none'
          }}
          title="Manage Roasters"
        >
          ⚙️
        </Link>
      </div>

      {/* Roaster Details */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
          <strong>Name:</strong>
          <span>{roaster.name}</span>
          
          {roaster.description && (
            <>
              <strong>Description:</strong>
              <span>{roaster.description}</span>
            </>
          )}
          
          {roaster.url && (
            <>
              <strong>Website:</strong>
              <span>
                <a href={roaster.url} target="_blank" rel="noopener noreferrer">{roaster.url}</a>
              </span>
            </>
          )}
          
          {roaster.notes && (
            <>
              <strong>Notes:</strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{roaster.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📊 Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.total_products}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Products</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.total_batches}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Batches</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.total_brew_sessions}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Brew Sessions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{statistics.active_batches}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Active Batches</div>
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
        </div>
      )}

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>☕ Recent Products</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {recentProducts.map(product => (
              <div key={product.id} style={{ 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                backgroundColor: '#fafafa' 
              }}>
                <h4 style={{ margin: '0 0 10px 0' }}>
                  <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: '#6d4c41' }}>
                    {product.product_name}
                  </Link>
                </h4>
                <p><strong>Bean Type:</strong> {Array.isArray(product.bean_type) ? product.bean_type.map(bt => bt.name).join(', ') : 'Unknown'}</p>
                <p><strong>Country:</strong> {product.country?.name || 'Unknown'}</p>
                {product.rating && (
                  <p><strong>Rating:</strong> <StarRating rating={product.rating} readOnly={true} maxRating={5} /></p>
                )}
              </div>
            ))}
          </div>
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
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Method</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Coffee</th>
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
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <Link to={`/products/${session.product_id}`} style={{ textDecoration: 'none' }}>
                        {session.product_details?.product_name || 'Unknown'}
                      </Link>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.brew_method?.name || '-'}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{session.amount_coffee_grams || '-'}g</td>
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

export default RoasterDetail;