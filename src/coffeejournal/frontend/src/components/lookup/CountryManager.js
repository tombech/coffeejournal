import React from 'react';
import { useNavigate } from 'react-router-dom';
import LookupManager from '../LookupManager';

function CountryManager() {
  const navigate = useNavigate();

  const customFields = [
    { name: 'region', label: 'Region/Area', type: 'text', required: false },
    { name: 'elevation', label: 'Typical Elevation (m)', type: 'number', required: false },
    { name: 'harvest_season', label: 'Harvest Season', type: 'text', required: false }
  ];

  return (
    <LookupManager
      title="Countries"
      apiEndpoint="countries"
      singularName="Country"
      onNavigateBack={() => navigate('/settings')}
      fields={customFields}
    />
  );
}

export default CountryManager;