import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HeadlessAutocomplete from '../HeadlessAutocomplete';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('HeadlessAutocomplete', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    fetch.mockClear();
    mockOnChange.mockClear();
  });

  test('renders input field with placeholder', () => {
    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    expect(screen.getByPlaceholderText('Search roasters...')).toBeInTheDocument();
  });

  test('displays current value in input', () => {
    const testValue = { id: 1, name: 'Blue Bottle Coffee' };
    
    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={testValue}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    expect(screen.getByDisplayValue('Blue Bottle Coffee')).toBeInTheDocument();
  });

  test('makes API call when user types', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Blue Bottle Coffee' },
        { id: 2, name: 'Blue Mountain Coffee' }
      ]
    });

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'blue');
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/roasters/search?q=blue');
    });
  });

  test('displays search results', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Blue Bottle Coffee' },
        { id: 2, name: 'Blue Mountain Coffee' }
      ]
    });

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'blue');
    
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
      expect(screen.getByText('Blue Mountain Coffee')).toBeInTheDocument();
    });
  });

  test('calls onChange when item is selected', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Blue Bottle Coffee' }
      ]
    });

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'blue');
    
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Blue Bottle Coffee'));
    
    expect(mockOnChange).toHaveBeenCalledWith({ id: 1, name: 'Blue Bottle Coffee' });
  });

  test('allows creating new items', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'new roaster');
    
    await waitFor(() => {
      expect(screen.getByText('Create "new roaster"')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Create "new roaster"'));
    
    expect(mockOnChange).toHaveBeenCalledWith({ 
      id: null, 
      name: 'new roaster', 
      isNew: true 
    });
  });

  test('creates new item on blur when no match found', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'unique roaster');
    fireEvent.blur(input);
    
    expect(mockOnChange).toHaveBeenCalledWith({ 
      id: null, 
      name: 'unique roaster', 
      isNew: true 
    });
  });

  test('handles loading state', async () => {
    const user = userEvent.setup();
    // Mock a slow response
    fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Test Result' }]
        }), 100)
      )
    );

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'test');
    
    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  test('clears selection when input is cleared', async () => {
    const user = userEvent.setup();
    
    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: 1, name: 'Blue Bottle Coffee' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByDisplayValue('Blue Bottle Coffee');
    await user.clear(input);
    
    expect(mockOnChange).toHaveBeenCalledWith({ 
      id: null, 
      name: '', 
      isNew: false 
    });
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error searching lookups:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('respects disabled state', () => {
    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
        disabled={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    expect(input).toBeDisabled();
  });

  test('respects required attribute', () => {
    render(
      <HeadlessAutocomplete
        lookupType="roasters"
        value={{ id: null, name: '' }}
        onChange={mockOnChange}
        placeholder="Search roasters..."
        required={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Search roasters...');
    expect(input).toBeRequired();
  });
});