import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProductDetail from '../ProductDetail';
import { ToastProvider } from '../Toast';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console.log for debug logs
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock window.confirm
global.confirm = jest.fn();

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn()
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('ProductDetail Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    confirm.mockClear();
    mockNavigate.mockClear();
    console.log.mockClear();
    useParams.mockReturnValue({ id: '1' });
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  test('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ProductDetail />);
    
    expect(screen.getByText('Loading product details...')).toBeInTheDocument();
  });

  test('renders error state when product API fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch product details/)).toBeInTheDocument();
    });
  });

  test('renders product not found when product is null', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch product details.*HTTP error! status: 404/)).toBeInTheDocument();
    });
  });

  test('renders product details successfully', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee Product',
      roaster: { id: 1, name: 'Blue Bottle Coffee' },
      bean_type: [{ id: 1, name: 'Arabica' }, { id: 2, name: 'Robusta' }],
      country: { id: 1, name: 'Ethiopia' },
      region: [{ id: 1, name: 'Yirgacheffe' }],
      bean_process: 'Washed',
      roast_type: 5,
      decaf: true,
      decaf_method: { id: 1, name: 'Swiss Water' },
      rating: 4.5,
      description: 'Amazing coffee with floral notes',
      notes: 'Perfect for morning brewing',
      url: 'https://example.com/coffee',
      image_url: 'https://example.com/image.jpg'
    };

    const mockBatches = [
      {
        id: 1,
        roast_date: '2025-01-01',
        purchase_date: '2025-01-02',
        amount_grams: 250,
        price: 150.50,
        price_per_cup: 12.50,
        seller: 'Local Coffee Shop',
        rating: 4.0,
        notes: 'Fresh batch'
      }
    ];

    const mockBrewSessions = [
      {
        id: 1,
        product_id: 1,
        timestamp: '2025-01-01T10:00:00.000Z',
        score: 8.5,
        sweetness: 7,
        acidity: 6,
        body: 8,
        aroma: 7,
        bitterness: 3
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatches
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBrewSessions
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      // Check product details
      expect(screen.getByText('Test Coffee Product')).toBeInTheDocument();
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
      expect(screen.getByText('Arabica, Robusta')).toBeInTheDocument();
      expect(screen.getByText('Ethiopia')).toBeInTheDocument();
      expect(screen.getByText('Yirgacheffe')).toBeInTheDocument();
      expect(screen.getByText('Washed')).toBeInTheDocument();
      expect(screen.getByText(/Yes \(Swiss Water\)/)).toBeInTheDocument();
      expect(screen.getByText('Amazing coffee with floral notes')).toBeInTheDocument();
      expect(screen.getByText('Perfect for morning brewing')).toBeInTheDocument();
      
      // Check batch details
      expect(screen.getByText('Batches for this Product')).toBeInTheDocument();
      expect(screen.getByText('Batch #1')).toBeInTheDocument();
      expect(screen.getByText('250g')).toBeInTheDocument();
      expect(screen.getByText('150.50 kr')).toBeInTheDocument();
      expect(screen.getByText('12.50 kr')).toBeInTheDocument();
      expect(screen.getByText('Local Coffee Shop')).toBeInTheDocument();
      expect(screen.getByText('Fresh batch')).toBeInTheDocument();
    });

    // Check that all API calls were made
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch).toHaveBeenCalledWith('/api/products/1');
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/products\/1\/batches\?t=\d+/));
    expect(fetch).toHaveBeenCalledWith('/api/brew_sessions');
  });

  test('handles missing product data gracefully', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Minimal Coffee',
      roaster: null,
      bean_type: null,
      country: null,
      region: null,
      bean_process: null,
      roast_type: null,
      decaf: false,
      rating: null,
      description: null,
      notes: null,
      url: null,
      image_url: null
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Minimal Coffee')).toBeInTheDocument();
      expect(screen.getAllByText('-')).toHaveLength(9); // Should show dashes for missing data
      expect(screen.getByText('No')).toBeInTheDocument(); // For decaf
      expect(screen.getByText('No batches registered for this product.')).toBeInTheDocument();
    });
  });

  test('renders analytics sections when brew sessions exist', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    const mockBrewSessions = [
      {
        id: 1,
        product_id: 1,
        timestamp: '2025-01-01T10:00:00.000Z',
        score: 8.5,
        sweetness: 7,
        acidity: 6,
        body: 8,
        aroma: 7,
        bitterness: 3
      },
      {
        id: 2,
        product_id: 1,
        timestamp: '2025-01-02T10:00:00.000Z',
        score: 6.0
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBrewSessions
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('🏆 Top 5 Brews')).toBeInTheDocument();
      expect(screen.getByText('💩 Bottom 5 Brews')).toBeInTheDocument();
      expect(screen.getByText('📊 Flavor Profile')).toBeInTheDocument();
    });
  });

  test('handles no brew sessions gracefully', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
      
      // Analytics sections should not be rendered for empty sessions
      expect(screen.queryByText('🏆 Top 5 Brews')).not.toBeInTheDocument();
      expect(screen.queryByText('📊 Flavor Profile')).not.toBeInTheDocument();
    });
  });

  test('renders action buttons', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      // Check action buttons
      const editButton = screen.getByTitle('Edit Product');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveAttribute('href', '/products/edit/1');
      
      const deleteButton = screen.getByTitle('Delete Product');
      expect(deleteButton).toBeInTheDocument();
      
      const addBatchButton = screen.getByTitle('Add New Batch');
      expect(addBatchButton).toBeInTheDocument();
    });
  });

  test('handles product deletion with confirmation', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true
      });

    confirm.mockReturnValueOnce(true);

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete Product');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this product and all its batches?'
      );
      expect(fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'DELETE'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/products');
    });
  });

  test('handles batch deletion with confirmation', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    const mockBatches = [
      {
        id: 1,
        roast_date: '2025-01-01',
        amount_grams: 250,
        price: 150.50,
        seller: 'Test Seller'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatches
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    confirm.mockReturnValueOnce(true);

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Batch #1')).toBeInTheDocument();
    });

    const deleteBatchButton = screen.getByTitle('Delete Batch');
    fireEvent.click(deleteBatchButton);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete this batch?');
      expect(fetch).toHaveBeenCalledWith('/api/batches/1', {
        method: 'DELETE'
      });
    });
  });

  test('toggles batch form visibility', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
    });

    const addBatchButton = screen.getByTitle('Add New Batch');
    fireEvent.click(addBatchButton);

    // After clicking, button should change to cancel
    await waitFor(() => {
      expect(screen.getByTitle('Cancel')).toBeInTheDocument();
    });
  });

  test('displays roast visualization correctly', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' },
      roast_type: 7
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Coffee')).toBeInTheDocument();
      // Should show roast visualization with the value
      expect(screen.getByText(/\(7\)/)).toBeInTheDocument();
    });
  });

  test('formats dates correctly', async () => {
    const mockProduct = {
      id: 1,
      product_name: 'Test Coffee',
      roaster: { id: 1, name: 'Test Roaster' }
    };

    const mockBatches = [
      {
        id: 1,
        roast_date: '2025-01-15',
        purchase_date: '2025-01-16'
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProduct
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatches
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      // Should format dates in Norwegian format (DD.MM.YY)
      expect(screen.getByText('15.01.25')).toBeInTheDocument();
      expect(screen.getByText('16.01.25')).toBeInTheDocument();
    });
  });
});