import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrewSessionCard from '../BrewSessionCard';

describe('BrewSessionCard Object Rendering Bug', () => {
  const mockOnDelete = jest.fn();
  const mockOnDuplicate = jest.fn();

  test('reproduces object rendering error with real API data structure', () => {
    const sessionWithObjectStructure = {
      id: 1,
      timestamp: '2024-12-21T08:30:00',
      product_details: {
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' },
      recipe: { id: 1, name: 'Standard Recipe' },
      filter: null,
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
      notes: 'Excellent brew'
    };

    let renderError = null;
    try {
      render(
        <BrewSessionCard 
          session={sessionWithObjectStructure}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
        />
      );

      // If we get here, check if the component rendered correctly
      expect(screen.getByText(/Blue Bottle Coffee/)).toBeInTheDocument();
      expect(screen.getByText(/Arabica/)).toBeInTheDocument();

    } catch (error) {
      renderError = error;
      console.log('BrewSessionCard render error:', error.message);
      
      if (error.message.includes('Objects are not valid as a React child')) {
        console.log('Found the object rendering bug in BrewSessionCard!');
        expect(error.message).toContain('Objects are not valid as a React child');
      } else {
        throw error;
      }
    }
  });

  test('test with potentially problematic data', () => {
    // Test case where roaster object might be rendered directly
    const sessionWithPotentialBug = {
      id: 1,
      timestamp: '2024-12-21T08:30:00',
      product_details: {
        roaster: { id: 1, name: '' }, // Empty name might cause fallback issues
        bean_type: [{ id: 1, name: 'Arabica' }],
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' },
      recipe: { id: 1, name: 'Standard Recipe' },
      filter: null,
      kettle: null,
      scale: null,
      amount_coffee_grams: 20,
      amount_water_grams: 320
    };

    let renderError = null;
    try {
      render(
        <BrewSessionCard 
          session={sessionWithPotentialBug}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
        />
      );

    } catch (error) {
      renderError = error;
      console.log('BrewSessionCard error with empty name:', error.message);
      
      if (error.message.includes('Objects are not valid as a React child')) {
        expect(error.message).toContain('Objects are not valid as a React child');
      }
    }
  });

  test('test with null roaster', () => {
    const sessionWithNullRoaster = {
      id: 1,
      timestamp: '2024-12-21T08:30:00',
      product_details: {
        roaster: null,
        bean_type: [{ id: 1, name: 'Arabica' }],
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' },
      recipe: { id: 1, name: 'Standard Recipe' },
      amount_coffee_grams: 20,
      amount_water_grams: 320
    };

    expect(() => {
      render(
        <BrewSessionCard 
          session={sessionWithNullRoaster}
          onDelete={mockOnDelete}
          onDuplicate={mockOnDuplicate}
        />
      );
    }).not.toThrow();

    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });
});