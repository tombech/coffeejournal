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

describe('ProductForm', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  test('renders form fields', () => {
    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    expect(screen.getByLabelText('Roaster *')).toBeInTheDocument();
    expect(screen.getByLabelText('Bean Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Roast Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Decaf')).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: 'Create Product' })).toBeInTheDocument();
  });

  test('submits form with correct data format', async () => {
    const user = userEvent.setup();
    
    // Mock roaster search
    fetch.mockImplementation((url) => {
      if (url.includes('/api/roasters/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Blue Bottle Coffee' }]
        });
      }
      if (url.includes('/api/bean_types/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Arabica' }]
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 1, product_name: 'Test Product' })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Fill in roaster field
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'Blue');
    
    await waitFor(() => {
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Blue Bottle Coffee'));
    
    // Fill in bean type field
    const beanTypeInput = screen.getByLabelText('Bean Type');
    await user.type(beanTypeInput, 'Arab');
    
    await waitFor(() => {
      expect(screen.getByText('Arabica')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Arabica'));
    
    // Fill in product name
    await user.type(screen.getByLabelText('Product Name'), 'Test Product');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
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
          bean_type_name: ['Arabica'],
          country_id: null,
          country_name: null,
          region_id: [],
          region_name: [],
          product_name: 'Test Product',
          roast_type: null,
          description: '',
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
  });

  test('handles form submission with new items', async () => {
    const user = userEvent.setup();
    
    // Mock API responses - return empty arrays for searches (no existing items)
    fetch.mockImplementation((url) => {
      if (url.includes('/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => []
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 1, product_name: 'Test Product' })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Type in new roaster
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'New Roaster');
    fireEvent.blur(roasterInput);
    
    // Type in new bean type
    const beanTypeInput = screen.getByLabelText('Bean Type');
    await user.type(beanTypeInput, 'New Bean Type');
    fireEvent.keyDown(beanTypeInput, { key: 'Enter' });
    
    // Fill in product name
    await user.type(screen.getByLabelText('Product Name'), 'Test Product');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roaster_id: null,
          roaster_name: 'New Roaster',
          bean_type_id: [],
          bean_type_name: ['New Bean Type'],
          country_id: null,
          country_name: null,
          region_id: [],
          region_name: [],
          product_name: 'Test Product',
          roast_type: null,
          description: '',
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
  });

  test('validates required roaster field', async () => {
    const user = userEvent.setup();
    
    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Try to submit without filling required field
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    // Should show validation error
    expect(screen.getByText('Roaster is required')).toBeInTheDocument();
  });

  test('shows decaf method field when decaf is checked', async () => {
    const user = userEvent.setup();
    
    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Initially decaf method should not be visible
    expect(screen.queryByLabelText('Decaf Method')).not.toBeInTheDocument();
    
    // Check decaf checkbox
    await user.click(screen.getByLabelText('Decaf'));
    
    // Now decaf method should be visible
    expect(screen.getByLabelText('Decaf Method')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock failed API call
    fetch.mockImplementation((url) => {
      if (url.includes('/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Test Roaster' }]
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Validation failed' })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Fill in required fields
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'Test');
    await user.click(screen.getByText('Test Roaster'));
    
    await user.type(screen.getByLabelText('Product Name'), 'Test Product');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
  });

  test('navigates to product list after successful creation', async () => {
    const user = userEvent.setup();
    
    // Mock successful API call
    fetch.mockImplementation((url) => {
      if (url.includes('/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, name: 'Test Roaster' }]
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 1, product_name: 'Test Product' })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <RouterWrapper>
        <ProductForm />
      </RouterWrapper>
    );
    
    // Fill and submit form
    const roasterInput = screen.getByLabelText('Roaster *');
    await user.type(roasterInput, 'Test');
    await user.click(screen.getByText('Test Roaster'));
    
    await user.type(screen.getByLabelText('Product Name'), 'Test Product');
    await user.click(screen.getByRole('button', { name: 'Create Product' }));
    
    // Should navigate to products list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });
});