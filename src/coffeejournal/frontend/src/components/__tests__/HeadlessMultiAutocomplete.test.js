import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HeadlessMultiAutocomplete from '../HeadlessMultiAutocomplete';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('HeadlessMultiAutocomplete', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    fetch.mockClear();
    mockOnChange.mockClear();
  });

  test('renders input field with placeholder', () => {
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    expect(screen.getByPlaceholderText('Search bean types...')).toBeInTheDocument();
  });

  test('displays selected items as chips', () => {
    const selectedItems = [
      { id: 1, name: 'Arabica' },
      { id: 2, name: 'Robusta' }
    ];
    
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={selectedItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    expect(screen.getByText('Arabica')).toBeInTheDocument();
    expect(screen.getByText('Robusta')).toBeInTheDocument();
  });

  test('makes API call when user types', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' },
        { id: 2, name: 'Arabian Mocha' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/bean_types/search?q=arab');
    });
  });

  test('displays search results', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' },
        { id: 2, name: 'Arabian Mocha' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
      expect(screen.getByText('Arabian Mocha')).toBeInTheDocument();
    });
  });

  test('adds item when selected from suggestions', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Arabica'));
    
    expect(mockOnChange).toHaveBeenCalledWith([{ id: 1, name: 'Arabica' }]);
  });

  test('adds multiple items', async () => {
    const user = userEvent.setup();
    const existingItems = [{ id: 1, name: 'Arabica' }];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 2, name: 'Robusta' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={existingItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'rob');
    
    await waitFor(() => {
      expect(screen.getByText('Robusta')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Robusta'));
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: 1, name: 'Arabica' },
      { id: 2, name: 'Robusta' }
    ]);
  });

  test('removes item when chip close button is clicked', async () => {
    const user = userEvent.setup();
    const selectedItems = [
      { id: 1, name: 'Arabica' },
      { id: 2, name: 'Robusta' }
    ];
    
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={selectedItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    // Find the remove button for Arabica (first item)
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith([{ id: 2, name: 'Robusta' }]);
  });

  test('filters out already selected items from suggestions', async () => {
    const user = userEvent.setup();
    const selectedItems = [{ id: 1, name: 'Arabica' }];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' }, // Already selected
        { id: 2, name: 'Arabian Mocha' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={selectedItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      // Should only show Arabian Mocha, not Arabica since it's already selected
      expect(screen.getByText('Arabian Mocha')).toBeInTheDocument();
      expect(screen.queryByText('Arabica')).not.toBeInTheDocument();
    });
  });

  test('creates new item when Enter is pressed', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'new bean type');
    await user.keyboard('{Enter}');
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: null, name: 'new bean type', isNew: true }
    ]);
  });

  test('does not add duplicate items', async () => {
    const user = userEvent.setup();
    const existingItems = [{ id: 1, name: 'Arabica' }];
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={existingItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Arabica'));
    
    // Should not call onChange since the item already exists
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('clears input after selection', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica' }
      ]
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Arabica'));
    
    // Input should be cleared after selection
    expect(input.value).toBe('');
  });

  test('allows creating new items via suggestion dropdown', async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'unique bean');
    
    await waitFor(() => {
      expect(screen.getByText('Create "unique bean"')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Create "unique bean"'));
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { id: null, name: 'unique bean', isNew: true }
    ]);
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
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'test');
    
    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error searching lookups:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('respects disabled state', () => {
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={[]}
        onChange={mockOnChange}
        placeholder="Search bean types..."
        disabled={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    expect(input).toBeDisabled();
  });

  test('prevents adding duplicate items by name', async () => {
    const user = userEvent.setup();
    const existingItems = [{ id: null, name: 'Custom Bean', isNew: true }];
    
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={existingItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    await user.type(input, 'Custom Bean');
    await user.keyboard('{Enter}');
    
    // Should not add duplicate by name
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('handles empty value prop', () => {
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search bean types...');
    expect(input).toBeInTheDocument();
  });

  test('shows chip count with many selected items', () => {
    const manyItems = [
      { id: 1, name: 'Arabica' },
      { id: 2, name: 'Robusta' },
      { id: 3, name: 'Liberica' },
      { id: 4, name: 'Excelsa' }
    ];
    
    render(
      <HeadlessMultiAutocomplete
        lookupType="bean_types"
        value={manyItems}
        onChange={mockOnChange}
        placeholder="Search bean types..."
      />
    );
    
    // All chips should be visible
    expect(screen.getByText('Arabica')).toBeInTheDocument();
    expect(screen.getByText('Robusta')).toBeInTheDocument();
    expect(screen.getByText('Liberica')).toBeInTheDocument();
    expect(screen.getByText('Excelsa')).toBeInTheDocument();
  });
});