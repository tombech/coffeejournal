import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BrewSessionForm from '../BrewSessionForm';
import ProductForm from '../ProductForm';
import BatchForm from '../BatchForm';
import { ToastProvider } from '../Toast';

// Mock fetch with enriched data as the backend should return
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock HeadlessUI dependencies for this test file
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock;

// Mock getBoundingClientRect for HeadlessUI
const mockBoundingClientRect = jest.fn().mockReturnValue({
  width: 120,
  height: 40,
  top: 0,
  left: 0,
  bottom: 40,
  right: 120,
  x: 0,
  y: 0,
  toJSON: jest.fn()
});

Element.prototype.getBoundingClientRect = mockBoundingClientRect;
HTMLElement.prototype.getBoundingClientRect = mockBoundingClientRect;

const mockEnrichedProducts = [
  {
    id: 1,
    product_name: 'Test Coffee',
    roaster: { id: 1, name: 'Blue Bottle Coffee' }, // Object format
    bean_type: [{ id: 1, name: 'Arabica' }],
    country: { id: 1, name: 'Ethiopia' },
    region: [{ id: 1, name: 'Yirgacheffe' }],
    decaf: false,
    decaf_method: null
  },
  {
    id: 2,
    product_name: 'Decaf Coffee',
    roaster: { id: 2, name: 'Intelligentsia' }, // Object format
    bean_type: [{ id: 1, name: 'Arabica' }],
    country: { id: 2, name: 'Colombia' },
    region: [],
    decaf: true,
    decaf_method: { id: 1, name: 'Swiss Water Process' }
  }
];

const mockLookupData = {
  brew_methods: [{ id: 1, name: 'V60' }],
  recipes: [{ id: 1, name: 'James Hoffmann V60' }],
  grinders: [{ id: 1, name: 'Baratza Encore' }],
  filters: [{ id: 1, name: 'Hario V60 Paper Filter' }],
  kettles: [{ id: 1, name: 'Fellow Stagg' }],
  scales: [{ id: 1, name: 'Acaia Pearl' }],
  roasters: [{ id: 1, name: 'Blue Bottle Coffee' }],
  bean_types: [{ id: 1, name: 'Arabica' }],
  countries: [{ id: 1, name: 'Ethiopia' }],
  decaf_methods: [{ id: 1, name: 'Swiss Water Process' }]
};

const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Object Rendering Consistency Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const setupMockFetch = () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEnrichedProducts)
        });
      }
      
      // Mock all lookup endpoints
      const endpoints = ['brew_methods', 'recipes', 'grinders', 'filters', 'kettles', 'scales', 'roasters', 'bean_types', 'countries', 'decaf_methods'];
      for (const endpoint of endpoints) {
        if (url.includes(`/${endpoint}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLookupData[endpoint])
          });
        }
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
  };

  test('BrewSessionForm should render roaster names correctly from objects', async () => {
    setupMockFetch();

    renderWithProviders(<BrewSessionForm />);

    await waitFor(() => {
      expect(screen.getByText(/Test Coffee \(Blue Bottle Coffee\)/)).toBeInTheDocument();
      expect(screen.getByText(/Decaf Coffee \(Intelligentsia\)/)).toBeInTheDocument();
    });

    // Ensure no [object Object] is rendered
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  test('ProductForm should handle enriched lookup objects in edit mode', async () => {
    const productWithEnrichedData = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Blue Bottle Coffee' },
      bean_type: [{ id: 1, name: 'Arabica' }],
      country: { id: 1, name: 'Ethiopia' },
      region: [{ id: 1, name: 'Yirgacheffe' }],
      decaf: true,
      decaf_method: { id: 1, name: 'Swiss Water Process' }
    };

    mockFetch.mockImplementation((url) => {
      if (url.includes('/products/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(productWithEnrichedData)
        });
      }
      
      const endpoints = ['roasters', 'bean_types', 'countries', 'decaf_methods'];
      for (const endpoint of endpoints) {
        if (url.includes(`/${endpoint}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLookupData[endpoint])
          });
        }
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    // Mock router hooks properly
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useParams: () => ({ id: '1' }),
      useNavigate: () => mockNavigate,
    }));

    // Use MemoryRouter with specific route for edit mode
    render(
      <MemoryRouter initialEntries={['/products/edit/1']}>
        <ToastProvider>
          <ProductForm />
        </ToastProvider>
      </MemoryRouter>
    );

    // Wait for form to load with enriched data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Coffee')).toBeInTheDocument();
    });

    // Ensure no [object Object] is rendered anywhere
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('[object Object]');
  });

  test('BatchForm should not render object placeholders', async () => {
    setupMockFetch();

    const batchData = {
      id: 1,
      roast_date: '2024-01-15',
      purchase_date: '2024-01-10',
      amount_grams: 250,
      price: 149.00,
      seller: 'Local Coffee Shop',
      notes: 'Great batch',
      rating: 4
    };

    renderWithProviders(<BatchForm productId={1} initialData={batchData} onBatchSubmitted={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    });

    // Ensure no [object Object] is rendered
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('[object Object]');
  });

  test('All forms should handle null/undefined lookup objects gracefully', async () => {
    const productsWithNullRoaster = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: null, // Null roaster
        bean_type: [],
        country: null,
        region: []
      }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(productsWithNullRoaster)
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    renderWithProviders(<BrewSessionForm />);

    await waitFor(() => {
      expect(screen.getByText(/Test Coffee \(Unknown\)/)).toBeInTheDocument();
    });

    // Should gracefully handle null values
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  test('Forms should handle mixed object/string data gracefully', async () => {
    // Test what happens if backend returns inconsistent data
    const mixedDataProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: 'Blue Bottle Coffee', // String instead of object (legacy format)
        bean_type: [{ id: 1, name: 'Arabica' }], // Proper object format
        country: { id: 1, name: 'Ethiopia' }
      }
    ];

    mockFetch.mockImplementation((url) => {
      if (url.includes('/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mixedDataProducts)
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    renderWithProviders(<BrewSessionForm />);

    await waitFor(() => {
      // Should handle string gracefully when expecting object
      expect(screen.getByText(/Test Coffee \(Blue Bottle Coffee\)/)).toBeInTheDocument();
    });

    // Should not crash or show [object Object]
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });
});