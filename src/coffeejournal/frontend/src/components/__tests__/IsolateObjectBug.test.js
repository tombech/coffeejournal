import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test rendering objects directly to see the exact error
describe('Isolate Object Rendering Bug', () => {
  test('shows what happens when object is rendered directly', () => {
    const TestComponent = () => {
      const lookupObject = { id: 1, name: 'Test Name' };
      
      return (
        <div>
          <div>This will work: {lookupObject.name}</div>
          <div>This will fail: {lookupObject}</div>
        </div>
      );
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('Objects are not valid as a React child');
  });

  test('shows what happens with conditional rendering that might fail', () => {
    const TestComponent = () => {
      const session = {
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle' },
          bean_type: [{ id: 1, name: 'Arabica' }]
        }
      };
      
      return (
        <div>
          {/* This should work */}
          <div>Roaster: {session.product_details?.roaster?.name}</div>
          
          {/* This should work */}
          <div>Bean: {session.product_details?.bean_type?.[0]?.name}</div>
          
          {/* This might fail if we accidentally render the object */}
          <div>Test: {session.product_details?.roaster || 'Unknown'}</div>
        </div>
      );
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('Objects are not valid as a React child');
  });

  test('shows what happens with array rendering', () => {
    const TestComponent = () => {
      const beanTypes = [{ id: 1, name: 'Arabica' }, { id: 2, name: 'Robusta' }];
      
      return (
        <div>
          {/* This will work */}
          <div>Beans: {beanTypes.map(bt => bt.name).join(', ')}</div>
          
          {/* This will fail */}
          <div>Beans direct: {beanTypes}</div>
        </div>
      );
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('Objects are not valid as a React child');
  });
});