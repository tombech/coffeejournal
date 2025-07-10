import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import BrewSessionTable from './BrewSessionTable';
import BrewSessionForm from './BrewSessionForm';
import { useToast } from './Toast';

function Home() {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const fetchBrewSessions = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/brew_sessions`),
        fetch(`${API_BASE_URL}/products`)
      ]);
      
      if (!sessionsResponse.ok || !productsResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionsResponse.status} or ${productsResponse.status}`);
      }
      
      const sessionsData = await sessionsResponse.json();
      const productsData = await productsResponse.json();
      
      // Sort by timestamp descending
      const sortedSessions = sessionsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAllSessions(sortedSessions);
      setSessions(sortedSessions.slice(0, 15));
      setProducts(productsData);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrewSessions();
  }, []);

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this brew session?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/brew_sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      addToast('Brew session deleted successfully!', 'success');
      fetchBrewSessions(); // Refresh the list
    } catch (err) {
      addToast('Failed to delete brew session: ' + err.message, 'error');
      console.error('Error deleting brew session:', err);
    }
  };

  const handleDuplicate = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/brew_sessions/${sessionId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      addToast('Brew session duplicated successfully!', 'success');
      fetchBrewSessions(); // Refresh the list
    } catch (err) {
      addToast('Failed to duplicate brew session: ' + err.message, 'error');
      console.error('Error duplicating brew session:', err);
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setShowNewForm(true);
  };

  const handleSessionSubmitted = () => {
    setShowNewForm(false);
    setEditingSession(null);
    fetchBrewSessions(); // Refresh the list
  };

  if (loading) return <p>Loading recent brew sessions...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // Calculate comprehensive score for brew sessions (duplicated for product analytics)
  const calculateBrewScore = (session) => {
    // Use overall score if available
    if (session.score && session.score > 0) {
      return session.score;
    }
    
    // Otherwise calculate from tasting notes (bitterness is negative, others positive)
    const tastingNotes = [
      session.sweetness,
      session.acidity,
      session.body,
      session.aroma,
      session.flavor_profile_match
    ].filter(score => score && score > 0);
    
    // Bitterness is subtracted (inverted)
    const bitternessScore = session.bitterness ? (10 - session.bitterness) : 0;
    if (bitternessScore > 0) tastingNotes.push(bitternessScore);
    
    return tastingNotes.length > 0 ? tastingNotes.reduce((sum, score) => sum + score, 0) / tastingNotes.length : 0;
  };

  // Get top 5 brew sessions globally
  const getTopBrewSessions = () => {
    return allSessions
      .filter(session => calculateBrewScore(session) > 0)
      .sort((a, b) => calculateBrewScore(b) - calculateBrewScore(a))
      .slice(0, 5);
  };

  // Get bottom 5 brew sessions globally
  const getBottomBrewSessions = () => {
    return allSessions
      .filter(session => calculateBrewScore(session) > 0)
      .sort((a, b) => calculateBrewScore(a) - calculateBrewScore(b))
      .slice(0, 5);
  };

  // Get top 5 products based on average brew scores
  const getTopProducts = () => {
    const productScores = {};
    
    allSessions.forEach(session => {
      const score = calculateBrewScore(session);
      if (score > 0 && session.product_id) {
        if (!productScores[session.product_id]) {
          productScores[session.product_id] = {
            scores: [],
            sessions: [],
            product: products.find(p => p.id === session.product_id)
          };
        }
        productScores[session.product_id].scores.push(score);
        productScores[session.product_id].sessions.push(session);
      }
    });

    return Object.entries(productScores)
      .map(([productId, data]) => {
        // Calculate tasting averages for mini radar chart
        const validSessions = data.sessions.filter(session => 
          session.sweetness || session.acidity || session.bitterness || session.body || session.aroma
        );
        
        let averages = null;
        if (validSessions.length > 0) {
          const totals = { sweetness: 0, acidity: 0, bitterness: 0, body: 0, aroma: 0 };
          const counts = { sweetness: 0, acidity: 0, bitterness: 0, body: 0, aroma: 0 };
          
          validSessions.forEach(session => {
            ['sweetness', 'acidity', 'bitterness', 'body', 'aroma'].forEach(attribute => {
              if (session[attribute] && session[attribute] > 0) {
                totals[attribute] += session[attribute];
                counts[attribute]++;
              }
            });
          });
          
          averages = {
            sweetness: counts.sweetness > 0 ? totals.sweetness / counts.sweetness : 0,
            acidity: counts.acidity > 0 ? totals.acidity / counts.acidity : 0,
            bitterness: counts.bitterness > 0 ? totals.bitterness / counts.bitterness : 0,
            body: counts.body > 0 ? totals.body / counts.body : 0,
            aroma: counts.aroma > 0 ? totals.aroma / counts.aroma : 0
          };
        }

        return {
          product: data.product,
          averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
          sessionCount: data.scores.length,
          averages
        };
      })
      .filter(item => item.product && item.sessionCount >= 2) // At least 2 sessions
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);
  };

  // Norwegian date formatting
  const formatDateNorwegian = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Format seconds to minutes:seconds
  const formatSecondsToMinSec = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };


  // Mini radar chart component for products
  const MiniRadarChart = ({ data, size = 120 }) => {
    if (!data) return null;
    
    const center = size / 2;
    const maxRadius = 40;
    const angles = [0, 72, 144, 216, 288]; // 5 points, 72 degrees apart
    const values = [data.sweetness, data.acidity, data.body, data.aroma, data.bitterness];
    
    const getPoint = (angle, radius) => {
      const radians = (angle - 90) * Math.PI / 180;
      return {
        x: center + radius * Math.cos(radians),
        y: center + radius * Math.sin(radians)
      };
    };
    
    const dataPoints = values.map((value, index) => {
      const radius = (value / 10) * maxRadius;
      return getPoint(angles[index], radius);
    });
    
    const polygonPoints = dataPoints.map(point => `${point.x},${point.y}`).join(' ');
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="#e0e0e0" strokeWidth="1" />
        <circle cx={center} cy={center} r={maxRadius * 0.5} fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
        {angles.map((angle, index) => {
          const point = getPoint(angle, maxRadius);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          );
        })}
        <polygon
          points={polygonPoints}
          fill="rgba(54, 162, 235, 0.2)"
          stroke="rgba(54, 162, 235, 0.8)"
          strokeWidth="1"
        />
      </svg>
    );
  };

  return (
    <div>
      <h2>Welcome to your Coffee Journal!</h2>
      
      {showNewForm && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <BrewSessionForm
            initialData={editingSession}
            onSessionSubmitted={handleSessionSubmitted}
          />
          <button 
            onClick={() => {
              setShowNewForm(false);
              setEditingSession(null);
            }}
            style={{ marginTop: '10px' }}
          >
            Cancel
          </button>
        </div>
      )}

      <h3>Recent Brew Sessions</h3>
      <p>Your 15 most recent brew sessions:</p>
      
      <BrewSessionTable
        sessions={sessions}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onEdit={handleEdit}
        onRefresh={fetchBrewSessions}
        showNewForm={showNewForm}
        setShowNewForm={setShowNewForm}
        setEditingSession={setEditingSession}
      />

      {/* Analytics Section */}
      {allSessions.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          {/* Top 5 Brews */}
          <BrewSessionTable 
            sessions={getTopBrewSessions()} 
            title="🏆 Top 5 Brews (Global)"
            showProduct={true}
            showActions={false}
            showFilters={false}
            showAddButton={false}
            onDelete={() => {}}
            onDuplicate={() => {}}
            onEdit={() => {}}
          />

          {/* Bottom 5 Brews */}
          <BrewSessionTable 
            sessions={getBottomBrewSessions()} 
            title="💩 Bottom 5 Brews (Global)"
            showProduct={true}
            showActions={false}
            showFilters={false}
            showAddButton={false}
            onDelete={() => {}}
            onDuplicate={() => {}}
            onEdit={() => {}}
          />

          {/* Top 5 Products */}
          <div style={{ marginBottom: '30px' }}>
            <h3>🥇 Top 5 Products</h3>
            {getTopProducts().length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, 300px)', 
                gap: '20px',
                justifyContent: 'start'
              }}>
                {getTopProducts().map((item, index) => (
                  <Link 
                    key={item.product.id} 
                    to={`/products/${item.product.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ 
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}>
                    {/* Rank Badge */}
                    <div style={{ 
                      position: 'absolute',
                      top: '-10px',
                      left: '20px',
                      padding: '8px 12px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      #{index + 1}
                    </div>
                    
                    {/* Score Badge */}
                    <div style={{ 
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
                      padding: '8px 12px',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {item.averageScore.toFixed(1)}
                    </div>

                    {/* Product Info */}
                    <div style={{ marginTop: '15px', marginBottom: '20px', width: '100%' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>
                        {item.product.product_name}
                      </h4>
                      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        <div><strong>Roaster:</strong> {item.product.roaster || 'Unknown'}</div>
                        <div><strong>Bean Type:</strong> {Array.isArray(item.product.bean_type) ? item.product.bean_type.join(', ') : (item.product.bean_type || 'Unknown')}</div>
                        <div><strong>Country:</strong> {item.product.country || 'Unknown'}</div>
                        <div><strong>Sessions:</strong> {item.sessionCount} brews</div>
                      </div>
                    </div>

                    {/* Radar Chart */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <MiniRadarChart data={item.averages} />
                    </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No products with enough sessions yet (minimum 2 sessions required)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;