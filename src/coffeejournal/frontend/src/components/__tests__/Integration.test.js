import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProductForm from '../ProductForm';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: undefined })
}));

// Wrapper component for React Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Integration Tests - Autocomplete + Form Workflow', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  test('complete workflow: search existing items, add new items, submit form', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/roasters/search?q=blue')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 2, name: 'Blue Mountain Coffee' }
          ]
        });
      }
      if (url.includes('/api/bean_types/search?q=arab')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Arabica' }
          ]
        });
      }
      if (url.includes('/api/bean_types/search?q=new')) {
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      }
      if (url.includes('/api/countries/search?q=ethi')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Ethiopia' }
          ]
        });
      }
      if (url.includes('/api/countries/search?q=custom')) {
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: 1,
            product_name: 'Complex Test Product',
            roaster: { id: 1, name: 'Blue Bottle Coffee' },
            bean_type: [
              { id: 1, name: 'Arabica' },
              { id: null, name: 'New Bean Type' }
            ],
            country: { id: 1, name: 'Ethiopia' },
            region: [{ id: null, name: 'Custom Region' }]
          })
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Step 1: Search and select existing roaster
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'blue');
    
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
      expect(screen.getByText('Blue Mountain Coffee')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Blue Bottle Coffee'));
    expect(roasterInput).toHaveDisplayValue('Blue Bottle Coffee');
    
    // Step 2: Add existing bean type
    const beanTypeInput = screen.getByLabelText('Bean Type');
    await user.type(beanTypeInput, 'arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Arabica'));
    
    // Verify bean type chip appears
    expect(screen.getByText('Arabica')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument(); // Remove button
    
    // Step 3: Add new bean type
    await user.type(beanTypeInput, 'new bean type');
    fireEvent.keyDown(beanTypeInput, { key: 'Enter' });
    
    // Should show both bean types as chips
    expect(screen.getByText('Arabica')).toBeInTheDocument();
    expect(screen.getByText('new bean type')).toBeInTheDocument();
    expect(screen.getAllByText('×')).toHaveLength(2); // Two remove buttons
    
    // Step 4: Select existing country
    const countryInput = screen.getByLabelText('Country');
    await user.type(countryInput, 'ethi');
    
    await waitFor(() => {
      expect(screen.getByText('Ethiopia')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Ethiopia'));
    expect(countryInput).toHaveDisplayValue('Ethiopia');
    
    // Step 5: Add new region
    const regionInput = screen.getByLabelText('Region');
    await user.type(regionInput, 'custom region');
    fireEvent.keyDown(regionInput, { key: 'Enter' });
    
    expect(screen.getByText('custom region')).toBeInTheDocument();
    
    // Step 6: Fill other fields
    await user.type(screen.getByLabelText('Product Name'), 'Complex Test Product');
    await user.selectOptions(screen.getByLabelText('Roast Type'), '3');
    await user.type(screen.getByLabelText('Description'), 'A complex test product with mixed lookup types');
    
    // Step 7: Submit form
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    // Verify correct API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roaster_id: 1,
          roaster_name: 'Blue Bottle Coffee',
          bean_type_id: [1],
          bean_type_name: ['Arabica', 'new bean type'],
          country_id: 1,
          country_name: 'Ethiopia',
          region_id: [],
          region_name: ['custom region'],
          product_name: 'Complex Test Product',
          roast_type: 3,
          description: 'A complex test product with mixed lookup types',
          url: '',
          image_url: '',
          decaf: false,
          decaf_method_id: null,
          decaf_method_name: null,
          rating: null,
          bean_process: '',
          notes: ''
        })
      });
    });
    
    // Verify navigation occurs
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  test('remove items from multi-select fields', async () => {
    const user = userEvent.setup();
    
    // Mock empty search results to allow adding new items
    fetch.mockImplementation((url) => {
      if (url.includes('/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Add multiple bean types
    const beanTypeInput = screen.getByLabelText('Bean Type');
    
    await user.type(beanTypeInput, 'first type');
    fireEvent.keyDown(beanTypeInput, { key: 'Enter' });
    
    await user.type(beanTypeInput, 'second type');
    fireEvent.keyDown(beanTypeInput, { key: 'Enter' });
    
    await user.type(beanTypeInput, 'third type');
    fireEvent.keyDown(beanTypeInput, { key: 'Enter' });
    
    // Verify all three are added
    expect(screen.getByText('first type')).toBeInTheDocument();
    expect(screen.getByText('second type')).toBeInTheDocument();
    expect(screen.getByText('third type')).toBeInTheDocument();
    expect(screen.getAllByText('×')).toHaveLength(3);
    
    // Remove the middle one
    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[1]); // Remove "second type"
    
    // Verify only two remain
    expect(screen.getByText('first type')).toBeInTheDocument();
    expect(screen.queryByText('second type')).not.toBeInTheDocument();
    expect(screen.getByText('third type')).toBeInTheDocument();
    expect(screen.getAllByText('×')).toHaveLength(2);
  });

  test('keyboard navigation in autocomplete', async () => {
    const user = userEvent.setup();
    
    fetch.mockImplementation((url) => {
      if (url.includes('/api/roasters/search?q=test')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, name: 'Test Roaster 1' },
            { id: 2, name: 'Test Roaster 2' },
            { id: 3, name: 'Test Roaster 3' }
          ]
        });
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'test');
    
    await waitFor(() => {
      expect(screen.getByText('Test Roaster 1')).toBeInTheDocument();
    });
    
    // Navigate down with arrow keys
    fireEvent.keyDown(roasterInput, { key: 'ArrowDown' });
    fireEvent.keyDown(roasterInput, { key: 'ArrowDown' });
    
    // Select with Enter
    fireEvent.keyDown(roasterInput, { key: 'Enter' });
    
    // Should select the second item (index 1)
    expect(roasterInput).toHaveDisplayValue('Test Roaster 2');
  });

  test('debounced search prevents excessive API calls', async () => {
    const user = userEvent.setup();
    
    fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'Test Result' }]
      });
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    const roasterInput = screen.getByLabelText('Roaster *');
    
    // Type quickly
    await user.type(roasterInput, 'test', { delay: 50 });
    
    // Wait for debounce
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
    
    // Should only make one API call despite multiple keystrokes
    expect(fetch).toHaveBeenCalledWith('/api/roasters/search?q=test');
  });

  test('prevents object rendering errors with lookup data', async () => {
    const user = userEvent.setup();
    
    // Mock API to return object-based lookup data
    fetch.mockImplementation((url) => {
      if (url.includes('/api/roasters/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Blue Bottle Coffee' }]
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: 1,
            product_name: 'Test Product',
            roaster: { id: 1, name: 'Blue Bottle Coffee' },
            bean_type: [{ id: 1, name: 'Arabica' }],
            country: { id: 1, name: 'Ethiopia' }
          })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const { container } = render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Fill and submit form
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'blue');
    await user.click(screen.getByText('Blue Bottle Coffee'));
    
    await user.type(screen.getByLabelText('Product Name'), 'Test Product');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    // Verify no "[object Object]" appears in the DOM
    await waitFor(() => {
      expect(container).not.toHaveTextContent('[object Object]');
    });
  });
});