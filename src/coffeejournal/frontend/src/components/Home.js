import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import BrewSessionTable from './BrewSessionTable';
import BrewSessionForm from './BrewSessionForm';
import { useToast } from './Toast';

function Home() {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const fetchBrewSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/brew_sessions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Sort by timestamp descending and take only the last 15
      const sortedSessions = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setSessions(sortedSessions.slice(0, 15));
    } catch (err) {
      setError('Failed to fetch brew sessions: ' + err.message);
      console.error('Error fetching brew sessions:', err);
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

  return (
    <div>
      <h2>Welcome to your Coffee Journal!</h2>
      <p>Here are your 15 most recent brew sessions:</p>
      
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
    </div>
  );
}

export default Home;