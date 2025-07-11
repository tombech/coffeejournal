import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProductList from '../ProductList';
import { ToastProvider } from '../Toast';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('ProductList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    confirm.mockClear();
  });

  test('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ProductList />);
    
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  test('renders error state when API fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch products/)).toBeInTheDocument();
    });
  });

  test('renders empty state when no products exist', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('No coffee products registered yet.')).toBeInTheDocument();
    });
  });

  test('renders products grouped by roaster', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Blue Bottle Blend',
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' },
        region: [{ id: 1, name: 'Yirgacheffe' }],
        rating: 4.5,
        description: 'Great coffee for morning brewing',
        url: 'https://bluebottle.com/coffee',
        decaf: false
      },
      {
        id: 2,
        product_name: 'Intelligentsia Blend',
        roaster: { id: 2, name: 'Intelligentsia' },
        bean_type: [{ id: 2, name: 'Robusta' }],
        country: { id: 2, name: 'Guatemala' },
        region: [],
        rating: 4.0,
        decaf: true
      },
      {
        id: 3,
        product_name: 'Another Blue Bottle',
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 3, name: 'Colombia' },
        region: [],
        decaf: false
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      // Check header
      expect(screen.getByText('Products')).toBeInTheDocument();
      
      // Check grouped roasters
      expect(screen.getByText('Blue Bottle Coffee (2)')).toBeInTheDocument();
      expect(screen.getByText('Intelligentsia (1)')).toBeInTheDocument();
      
      // Check product names
      expect(screen.getByText('Blue Bottle Blend')).toBeInTheDocument();
      expect(screen.getByText('Intelligentsia Blend')).toBeInTheDocument();
      expect(screen.getByText('Another Blue Bottle')).toBeInTheDocument();
    });
  });

  test('displays product details correctly', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Test Roaster' },
        bean_type: [{ id: 1, name: 'Arabica' }, { id: 2, name: 'Robusta' }],
        country: { id: 1, name: 'Ethiopia' },
        region: [{ id: 1, name: 'Yirgacheffe' }, { id: 2, name: 'Sidamo' }],
        rating: 4.5,
        description: 'Amazing coffee with floral notes and bright acidity',
        url: 'https://example.com/coffee',
        decaf: true,
        image_url: 'https://example.com/image.jpg'
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      // Check product details
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
      expect(screen.getByText('Arabica, Robusta')).toBeInTheDocument();
      expect(screen.getByText(/Ethiopia \(Yirgacheffe, Sidamo\)/)).toBeInTheDocument();
      expect(screen.getByText('Amazing coffee with floral notes and bright acidity')).toBeInTheDocument();
      expect(screen.getByText('DECAF')).toBeInTheDocument();
      expect(screen.getByText('Product Page')).toBeInTheDocument();
      
      // Check image
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(image).toHaveAttribute('alt', 'Arabica, Robusta');
    });
  });

  test('handles products with missing data gracefully', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Minimal Coffee',
        roaster: null,
        bean_type: null,
        country: null,
        region: null,
        rating: null,
        description: null,
        url: null,
        decaf: false
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Minimal Coffee')).toBeInTheDocument();
      expect(screen.getByText('Unknown Roaster (1)')).toBeInTheDocument();
      expect(screen.getByText('Unknown • Unknown')).toBeInTheDocument();
      
      // Should not show decaf badge
      expect(screen.queryByText('DECAF')).not.toBeInTheDocument();
      
      // Should not show rating, description, or product page link
      expect(screen.queryByText('Product Page')).not.toBeInTheDocument();
    });
  });

  test('renders navigation links', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      // Check navigation buttons
      const newProductLink = screen.getByTitle('New Product');
      expect(newProductLink).toBeInTheDocument();
      expect(newProductLink).toHaveAttribute('href', '/products/new');
      
      const settingsLink = screen.getByTitle('Back to Settings');
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  test('renders product action buttons', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Test Roaster' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' },
        decaf: false
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      // Check action buttons
      const viewButton = screen.getByTitle('View Details');
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveAttribute('href', '/products/1');
      
      const editButton = screen.getByTitle('Edit');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveAttribute('href', '/products/edit/1');
      
      const deleteButton = screen.getByTitle('Delete');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  test('handles delete confirmation and API call', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Test Roaster' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' },
        decaf: false
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      })
      .mockResolvedValueOnce({
        ok: true
      });

    confirm.mockReturnValueOnce(true);

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this coffee product and all its associated batches and brew sessions?'
      );
      expect(fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'DELETE'
      });
    });
  });

  test('handles delete cancellation', async () => {
    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Test Roaster' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' },
        decaf: false
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    });

    confirm.mockReturnValueOnce(false);

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(confirm).toHaveBeenCalled();
    // Should not make delete API call
    expect(fetch).toHaveBeenCalledTimes(1); // Only the initial fetch
  });

  test('handles API error response codes', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch products.*HTTP error! status: 500/)).toBeInTheDocument();
    });
  });

  test('makes correct API call', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderWithProviders(<ProductList />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products');
    });
  });
});