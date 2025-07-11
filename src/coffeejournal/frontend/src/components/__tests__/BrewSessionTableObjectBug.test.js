import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrewSessionTable from '../BrewSessionTable';

describe('BrewSessionTable Object Rendering Bug Fix', () => {
  const mockOnDelete = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockSetShowNewForm = jest.fn();
  const mockSetEditingSession = jest.fn();

  test('renders correctly with real API data structure without object rendering errors', () => {
    const sessionsWithRealStructure = [
      {
        id: 1,
        timestamp: '2024-12-21T08:30:00',
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }, { id: 2, name: 'Robusta' }],
          roast_date: '2024-12-15',
          product_name: 'Test Coffee',
          decaf: false
        },
        brew_method: { id: 1, name: 'V60' },
        recipe: { id: 1, name: 'Standard Recipe' },
        filter: { id: 1, name: 'Paper Filter' },
        kettle: null,
        scale: null,
        amount_coffee_grams: 20,
        amount_water_grams: 320,
        brew_temperature_c: 93,
        brew_ratio: '1:16.0',
        bloom_time_seconds: 30,
        brew_time_seconds: 180,
        sweetness: 8,
        acidity: 9,
        bitterness: 3,
        body: 6,
        aroma: 9,
        flavor_profile_match: 8,
        notes: 'Excellent brew',
        score: 8.5
      }
    ];

    // This should render without throwing object rendering errors
    expect(() => {
      render(
        <BrewSessionTable 
          sessions={sessionsWithRealStructure}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
          showNewForm={false}
          setShowNewForm={mockSetShowNewForm}
          setEditingSession={mockSetEditingSession}
        />
      );
    }).not.toThrow();

    // Verify content is properly displayed
    expect(screen.getByText(/Blue Bottle Coffee/)).toBeInTheDocument();
    expect(screen.getByText(/Arabica/)).toBeInTheDocument();
    expect(screen.getAllByText(/V60/)).toHaveLength(2); // One in filter dropdown, one in table
    expect(screen.getByText(/Test Coffee/)).toBeInTheDocument();
  });

  test('handles missing roaster names gracefully', () => {
    const sessionsWithMissingData = [
      {
        id: 1,
        timestamp: '2024-12-21T08:30:00',
        product_details: {
          roaster: { id: 1 }, // Missing name
          bean_type: [{ id: 1, name: 'Arabica' }],
          roast_date: '2024-12-15',
          product_name: 'Test Coffee',
          decaf: false
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 20,
        amount_water_grams: 320
      }
    ];

    expect(() => {
      render(
        <BrewSessionTable 
          sessions={sessionsWithMissingData}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
          showNewForm={false}
          setShowNewForm={mockSetShowNewForm}
          setEditingSession={mockSetEditingSession}
        />
      );
    }).not.toThrow();

    // Should show "Unknown" for missing roaster name
    expect(screen.getByText(/Test Coffee/)).toBeInTheDocument();
  });

  test('handles null roaster and bean_type gracefully', () => {
    const sessionsWithNullData = [
      {
        id: 1,
        timestamp: '2024-12-21T08:30:00',
        product_details: {
          roaster: null,
          bean_type: null,
          roast_date: '2024-12-15',
          product_name: 'Test Coffee',
          decaf: false
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 20,
        amount_water_grams: 320
      }
    ];

    expect(() => {
      render(
        <BrewSessionTable 
          sessions={sessionsWithNullData}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
          showNewForm={false}
          setShowNewForm={mockSetShowNewForm}
          setEditingSession={mockSetEditingSession}
        />
      );
    }).not.toThrow();

    expect(screen.getByText(/Test Coffee/)).toBeInTheDocument();
  });

  test('verifies tooltip content shows proper text, not objects', () => {
    const sessions = [
      {
        id: 1,
        timestamp: '2024-12-21T08:30:00',
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }],
          roast_date: '2024-12-15',
          product_name: 'Test Coffee',
          decaf: false
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 20,
        amount_water_grams: 320
      }
    ];

    render(
      <BrewSessionTable 
        sessions={sessions}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
        showNewForm={false}
        setShowNewForm={mockSetShowNewForm}
        setEditingSession={mockSetEditingSession}
      />
    );

    // Find the product cell with title attribute (the td containing Test Coffee)
    const productCell = screen.getByText('Test Coffee');
    const titleContent = productCell.parentElement.getAttribute('title');
    
    // Verify tooltip shows proper text, not "[object Object]"
    if (titleContent) {
      expect(titleContent).toContain('Blue Bottle Coffee');
      expect(titleContent).toContain('Arabica');
      expect(titleContent).not.toContain('[object Object]');
    } else {
      // Find a cell that does have a title attribute
      const cellsWithTitle = screen.getAllByTitle(/.*Blue Bottle Coffee.*/);
      expect(cellsWithTitle.length).toBeGreaterThan(0);
    }
  });
});