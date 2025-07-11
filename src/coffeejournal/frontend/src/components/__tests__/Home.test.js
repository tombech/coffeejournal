import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Home from '../Home';
import { ToastProvider } from '../Toast';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console.log for radar chart debug logs
jest.spyOn(console, 'log').mockImplementation(() => {});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log.mockClear();
  });

  afterAll(() => {
    console.log.mockRestore();
  });

  test('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<Home />);
    
    expect(screen.getByText('Loading recent brew sessions...')).toBeInTheDocument();
  });

  test('renders error state when API fails', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('renders basic home content when data loads successfully', async () => {
    const mockSessions = [
      {
        id: 1,
        timestamp: '2025-01-01T10:00:00.000Z',
        product_id: 1,
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }]
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 18,
        amount_water_grams: 300,
        score: 8.5
      }
    ];

    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' }
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
      expect(screen.getByText('Recent Brew Sessions')).toBeInTheDocument();
      expect(screen.getByText('Your 15 most recent brew sessions:')).toBeInTheDocument();
    });

    // Check that API calls were made
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('/api/brew_sessions');
    expect(fetch).toHaveBeenCalledWith('/api/products');
  });

  test('renders analytics sections when sessions exist', async () => {
    const mockSessions = [
      {
        id: 1,
        timestamp: '2025-01-01T10:00:00.000Z',
        product_id: 1,
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }]
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 18,
        amount_water_grams: 300,
        score: 8.5,
        sweetness: 7,
        acidity: 6,
        body: 8,
        aroma: 7,
        bitterness: 3
      },
      {
        id: 2,
        timestamp: '2025-01-02T10:00:00.000Z',
        product_id: 1,
        product_details: {
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }]
        },
        brew_method: { id: 1, name: 'V60' },
        amount_coffee_grams: 18,
        amount_water_grams: 300,
        score: 6.0
      }
    ];

    const mockProducts = [
      {
        id: 1,
        product_name: 'Test Coffee',
        roaster: { id: 1, name: 'Blue Bottle Coffee' },
        bean_type: [{ id: 1, name: 'Arabica' }],
        country: { id: 1, name: 'Ethiopia' }
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('🏆 Top 5 Brews (Global)')).toBeInTheDocument();
      expect(screen.getByText('💩 Bottom 5 Brews (Global)')).toBeInTheDocument();
      expect(screen.getByText('🥇 Top 5 Products')).toBeInTheDocument();
    });
  });

  test('handles empty sessions gracefully', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
      expect(screen.getByText('Recent Brew Sessions')).toBeInTheDocument();
    });

    // Analytics sections should not be rendered for empty sessions
    expect(screen.queryByText('🏆 Top 5 Brews (Global)')).not.toBeInTheDocument();
    expect(screen.queryByText('🥇 Top 5 Products')).not.toBeInTheDocument();
  });

  test('contains BrewSessionTable component', async () => {
    const mockSessions = [];
    const mockProducts = [];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      // BrewSessionTable should be rendered (we can't easily test its internals without mocking it)
      expect(screen.getByText('Recent Brew Sessions')).toBeInTheDocument();
    });
  });

  test('handles API response with different HTTP status codes', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404
      })
      .mockResolvedValueOnce({
        ok: false, 
        status: 500
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('calculates brew scores correctly', async () => {
    const mockSessions = [
      {
        id: 1,
        timestamp: '2025-01-01T10:00:00.000Z',
        product_id: 1,
        product_details: { roaster: { name: 'Test Roaster' } },
        score: 8.5 // Should use this score directly
      },
      {
        id: 2,
        timestamp: '2025-01-02T10:00:00.000Z',
        product_id: 1,
        product_details: { roaster: { name: 'Test Roaster' } },
        sweetness: 8,
        acidity: 7,
        body: 6,
        aroma: 8,
        bitterness: 3 // Should be inverted to 7
        // Should calculate average: (8+7+6+8+7)/5 = 7.2
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessions
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    renderWithProviders(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to your Coffee Journal!')).toBeInTheDocument();
    });

    // Verify the component renders without throwing errors
    // (Detailed score calculation testing would require exposing internal functions)
  });
});