import React from 'react';
import '@testing-library/jest-dom';
import HeadlessAutocomplete from '../HeadlessAutocomplete';

// Simple smoke tests for HeadlessAutocomplete that don't require complex UI rendering
describe('HeadlessAutocomplete - Simple Tests', () => {
  test('component can be imported without errors', () => {
    expect(HeadlessAutocomplete).toBeDefined();
    expect(typeof HeadlessAutocomplete).toBe('function');
  });
  
  test('component exports expected properties', () => {
    // This ensures the component is properly structured
    expect(HeadlessAutocomplete.name).toBe('HeadlessAutocomplete');
  });
  
  test('API_BASE_URL import works', () => {
    // Indirectly test that the component's dependencies are working
    const { API_BASE_URL } = require('../../config');
    expect(API_BASE_URL).toBeDefined();
  });
});