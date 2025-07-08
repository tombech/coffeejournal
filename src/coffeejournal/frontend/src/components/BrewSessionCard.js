import React, { useState } from 'react';
import BrewSessionForm from './BrewSessionForm'; // Import for edit functionality

function BrewSessionCard({ session, onDelete, onDuplicate }) {
  const [isEditing, setIsEditing] = useState(false);

  // Helper to format seconds into M:SS or HH:MM:SS
  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return 'N/A';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (isEditing) {
    return (
      <div className="card">
        <h3>Edit Brew Session</h3>
        <BrewSessionForm
          initialData={session} // Pass existing data to pre-fill form
          onSessionSubmitted={() => {
            setIsEditing(false); // Hide form after submission
            onDelete(); // Trigger a re-fetch in parent to update list
          }}
          product_batch_id={session.product_batch_id} // Pass batch ID
        />
        <button onClick={() => setIsEditing(false)}>Cancel Edit</button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Brew Session - {new Date(session.timestamp).toLocaleString()}</h3>
      <p><strong>Product:</strong> {session.product_details.roaster} - {session.product_details.bean_type} (Roast: {session.product_details.roast_date})</p>
      <p><strong>Method:</strong> {session.brew_method || 'N/A'} - <strong>Recipe:</strong> {session.recipe || 'N/A'}</p>
      <p>
        <strong>Coffee:</strong> {session.amount_coffee_grams || 'N/A'}g,
        <strong> Water:</strong> {session.amount_water_grams || 'N/A'}g,
        <strong> Temp:</strong> {session.brew_temperature_c || 'N/A'}°C
      </p>
      <p>
        <strong>Ratio:</strong> {session.brew_ratio || 'N/A'},
        <strong> Bloom:</strong> {formatTime(session.bloom_time_seconds)},
        <strong> Brew Time:</strong> {formatTime(session.brew_time_seconds)}
      </p>

      <h4>Flavor Scores:</h4>
      <ul>
        <li>Sweetness: {session.sweetness || 'N/A'}</li>
        <li>Acidity: {session.acidity || 'N/A'}</li>
        <li>Bitterness: {session.bitterness || 'N/A'}</li>
        <li>Body: {session.body || 'N/A'}</li>
        <li>Aroma: {session.aroma || 'N/A'}</li>
        <li>Flavor Profile Match: {session.flavor_profile_match || 'N/A'}</li>
      </ul>
      <p><strong>Notes:</strong> {session.notes || 'No notes.'}</p>

      <div className="actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={() => onDuplicate(session.id)}>Duplicate</button>
        <button className="delete" onClick={() => onDelete(session.id)}>Delete</button>
      </div>
    </div>
  );
}

export default BrewSessionCard;