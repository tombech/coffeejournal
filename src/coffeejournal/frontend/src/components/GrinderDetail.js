import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from './Toast';
import { API_BASE_URL } from '../config';

function GrinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [grinder, setGrinder] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGrinderDetail();
  }, [id]);

  const fetchGrinderDetail = async () => {
    setLoading(true);
    try {
      const [grinderResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/grinders/${id}`),
        fetch(`${API_BASE_URL}/grinders/${id}/stats`)
      ]);
      
      if (!grinderResponse.ok || !statsResponse.ok) {
        throw new Error(`HTTP error! status: ${grinderResponse.status || statsResponse.status}`);
      }
      
      const grinderData = await grinderResponse.json();
      const statsData = await statsResponse.json();
      
      setGrinder(grinderData);
      setStats(statsData);
    } catch (err) {
      setError("Failed to fetch grinder details: " + err.message);
      console.error("Error fetching grinder details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateManualGround = async () => {
    const amount = prompt("Enter additional manually ground amount (grams):");
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      try {
        const newTotal = (grinder.manually_ground_grams || 0) + parseFloat(amount);
        const response = await fetch(`${API_BASE_URL}/grinders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...grinder,
            manually_ground_grams: newTotal
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        addToast(`Added ${amount}g manually ground coffee`, 'success');
        fetchGrinderDetail(); // Refresh data
      } catch (err) {
        setError("Failed to update manual ground amount: " + err.message);
      }
    }
  };

  if (loading) return <p className="loading-message">Loading grinder details...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!grinder) return <p>Grinder not found.</p>;

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
        <h2 style={{ margin: 0, marginRight: 'auto' }}>{grinder.name}</h2>
        <Link 
          to={`/settings/grinders`}
          style={{ 
            padding: '6px 8px', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            textDecoration: 'none'
          }}
          title="Manage Grinders"
        >
          ⚙️
        </Link>
      </div>

      {/* Grinder Details */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 15px', alignItems: 'start' }}>
          <strong>Name:</strong>
          <span>{grinder.name}</span>
          
          {grinder.brand && (
            <>
              <strong>Brand:</strong>
              <span>{grinder.brand}</span>
            </>
          )}
          
          {grinder.grinder_type && (
            <>
              <strong>Type:</strong>
              <span>{grinder.grinder_type}</span>
            </>
          )}
          
          {grinder.burr_material && (
            <>
              <strong>Burr Material:</strong>
              <span>{grinder.burr_material}</span>
            </>
          )}
          
          {grinder.description && (
            <>
              <strong>Description:</strong>
              <span>{grinder.description}</span>
            </>
          )}
          
          {grinder.notes && (
            <>
              <strong>Notes:</strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{grinder.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      {stats && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>📊 Usage Statistics</h3>
            <button 
              onClick={handleUpdateManualGround}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#6d4c41', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Add manually ground coffee (for seasoning)"
            >
              + Manual Ground
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{stats.total_brews}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Brews</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                {stats.total_kilos > 0 ? `${stats.total_kilos}kg` : `${stats.total_grams_ground}g`}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Coffee Ground (Brews)</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>{stats.manually_ground_grams}g</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Manual Grinding</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {stats.total_grams_with_manual >= 1000 
                  ? `${(stats.total_grams_with_manual / 1000).toFixed(1)}kg` 
                  : `${stats.total_grams_with_manual}g`}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Ground</div>
            </div>
          </div>
          
          {/* Progress Bar for Seasoning */}
          {stats.total_grams_with_manual < 1000 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '5px', color: '#666' }}>
                Seasoning Progress (1kg recommended)
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e0e0e0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${Math.min(100, (stats.total_grams_with_manual / 1000) * 100)}%`, 
                  height: '100%', 
                  backgroundColor: stats.total_grams_with_manual >= 1000 ? '#4caf50' : '#ff9800',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {1000 - stats.total_grams_with_manual}g remaining for full seasoning
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GrinderDetail;