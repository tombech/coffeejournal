import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrewSessionCard from '../BrewSessionCard';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Object Rendering Error Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    
    // Suppress console.error for these tests since we're intentionally testing error scenarios
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('BrewSessionCard component renders lookup objects correctly', () => {
    const mockSession = {
      id: 1,
      timestamp: '2025-01-01T10:00:00.000Z',
      product_details: {
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' },
      recipe: { id: 1, name: 'Standard Recipe' },
      filter: { id: 1, name: 'Paper Filter' },
      kettle: { id: 1, name: 'Hario Kettle' },
      scale: { id: 1, name: 'Acaia Scale' },
      grinder: { id: 1, name: 'Comandante Grinder' },
      amount_coffee_grams: 18,
      amount_water_grams: 300,
      brew_temperature_c: 93
    };

    const { container } = render(<BrewSessionCard session={mockSession} />);

    // Check that lookup objects are not rendered as "[object Object]"
    expect(container).not.toHaveTextContent('[object Object]');
    
    // Check specific rendered content
    expect(container.textContent).toContain('Blue Bottle Coffee');
    expect(container.textContent).toContain('Arabica');
    expect(container.textContent).toContain('V60');
    expect(container.textContent).toContain('Standard Recipe');
    expect(container.textContent).toContain('Paper Filter');
    expect(container.textContent).toContain('Hario Kettle');
    expect(container.textContent).toContain('Acaia Scale');
  });

  test('BrewSessionCard renders consistent object format from backend', () => {
    const mockSession = {
      id: 1,
      timestamp: '2025-01-01T10:00:00.000Z',
      product_details: {
        roaster: { id: 1, name: 'Blue Bottle Coffee' }, // Consistent object format
        bean_type: [{ id: 1, name: 'Arabica' }], // Array of objects
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' }, // Object
      recipe: { id: 1, name: 'Standard Recipe' }, // Object
      filter: { id: 1, name: 'Paper Filter' }, // Object
      kettle: null, // Null value
      scale: undefined, // Undefined value
      amount_coffee_grams: 18
    };

    const { container } = render(<BrewSessionCard session={mockSession} />);

    // Should render object format correctly without "[object Object]"
    expect(container).not.toHaveTextContent('[object Object]');
    expect(container.textContent).toContain('Blue Bottle Coffee');
    expect(container.textContent).toContain('Arabica');
    expect(container.textContent).toContain('V60');
    expect(container.textContent).toContain('Standard Recipe');
    expect(container.textContent).toContain('Paper Filter');
    expect(container.textContent).toContain('N/A'); // For null/undefined values
  });

  test('BrewSessionCard handles null/undefined lookup values', () => {
    const mockSession = {
      id: 1,
      timestamp: '2025-01-01T10:00:00.000Z',
      product_details: {
        roaster: null,
        bean_type: undefined,
        roast_date: null
      },
      brew_method: null,
      recipe: undefined,
      filter: null,
      kettle: undefined,
      scale: null,
      grinder: undefined,
      amount_coffee_grams: 18
    };

    const { container } = render(<BrewSessionCard session={mockSession} />);

    // Should not crash and should show fallback values
    expect(container).not.toHaveTextContent('[object Object]');
    expect(container.textContent).toContain('Unknown');
    expect(container.textContent).toContain('N/A');
  });

  test('BrewSessionCard handles empty arrays in bean_type', () => {
    const mockSession = {
      id: 1,
      timestamp: '2025-01-01T10:00:00.000Z',
      product_details: {
        roaster: { id: 1, name: 'Test Roaster' },
        bean_type: [], // Empty array
        roast_date: '2024-12-15'
      },
      brew_method: { id: 1, name: 'V60' },
      amount_coffee_grams: 18
    };

    const { container } = render(<BrewSessionCard session={mockSession} />);

    // Should handle empty arrays gracefully
    expect(container).not.toHaveTextContent('[object Object]');
    expect(container.textContent).toContain('Test Roaster');
    expect(container.textContent).toContain('V60');
  });

  test('Detects when objects are accidentally rendered as React children', () => {
    // This test ensures our error detection works
    const BadComponent = () => {
      const lookupObject = { id: 1, name: 'Test' };
      return <div>{lookupObject}</div>; // This should cause an error
    };

    expect(() => {
      render(<BadComponent />);
    }).toThrow(/Objects are not valid as a React child/);
  });

  test('Component with properly extracted object properties renders correctly', () => {
    const GoodComponent = () => {
      const lookupObject = { id: 1, name: 'Test Item' };
      return <div>{lookupObject.name}</div>; // This should work fine
    };

    const { container } = render(<GoodComponent />);
    
    expect(container).not.toHaveTextContent('[object Object]');
    expect(container.textContent).toContain('Test Item');
  });

  test('Component with conditional object property access renders correctly', () => {
    const ConditionalComponent = ({ lookup }) => {
      return <div>{lookup?.name || lookup || 'Fallback'}</div>;
    };

    // Test with object
    const { container: container1 } = render(
      <ConditionalComponent lookup={{ id: 1, name: 'Object Name' }} />
    );
    expect(container1).not.toHaveTextContent('[object Object]');
    expect(container1.textContent).toContain('Object Name');

    // Test with string
    const { container: container2 } = render(
      <ConditionalComponent lookup="String Value" />
    );
    expect(container2).not.toHaveTextContent('[object Object]');
    expect(container2.textContent).toContain('String Value');

    // Test with null
    const { container: container3 } = render(
      <ConditionalComponent lookup={null} />
    );
    expect(container3).not.toHaveTextContent('[object Object]');
    expect(container3.textContent).toContain('Fallback');
  });

  test('Array of objects with map extraction renders correctly', () => {
    const ArrayComponent = ({ items }) => {
      return (
        <div>
          {Array.isArray(items) 
            ? items.map(item => item?.name || item).join(', ')
            : (items?.name || items || 'No items')
          }
        </div>
      );
    };

    // Test with array of objects
    const { container: container1 } = render(
      <ArrayComponent items={[{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]} />
    );
    expect(container1).not.toHaveTextContent('[object Object]');
    expect(container1.textContent).toContain('Item 1, Item 2');

    // Test with array of strings
    const { container: container2 } = render(
      <ArrayComponent items={['String 1', 'String 2']} />
    );
    expect(container2).not.toHaveTextContent('[object Object]');
    expect(container2.textContent).toContain('String 1, String 2');

    // Test with empty array
    const { container: container3 } = render(
      <ArrayComponent items={[]} />
    );
    expect(container3).not.toHaveTextContent('[object Object]');
    // Empty array results in empty string when joined, which is fine
    expect(container3.textContent).toBe('');

    // Test with single object
    const { container: container4 } = render(
      <ArrayComponent items={{ id: 1, name: 'Single Item' }} />
    );
    expect(container4).not.toHaveTextContent('[object Object]');
    expect(container4.textContent).toContain('Single Item');
  });
});