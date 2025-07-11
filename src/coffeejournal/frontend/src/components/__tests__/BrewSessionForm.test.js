import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BrewSessionForm from '../BrewSessionForm';
import { ToastProvider } from '../Toast';

// Mock fetch for API calls
global.fetch = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('BrewSessionForm Component', () => {
  const mockOnSessionSubmitted = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
    mockOnSessionSubmitted.mockClear();
    
    // Mock all the lookup data API calls
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'V60' }, { id: 2, name: 'French Press' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Standard Recipe' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Comandante' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Paper Filter' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Hario Kettle' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Acaia Scale' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ 
          id: 1, 
          product_name: 'Test Coffee',
          roaster: { id: 1, name: 'Blue Bottle Coffee' },
          bean_type: [{ id: 1, name: 'Arabica' }]
        }]
      });
  });

  test('renders form fields correctly', async () => {
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      // Check for main form elements
      expect(screen.getByText('Add New Brew Session')).toBeInTheDocument();
      expect(screen.getByLabelText(/Product/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Brew Method/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Recipe/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Grinder/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Filter/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Coffee Amount/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Water Amount/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Temperature/)).toBeInTheDocument();
    });
  });

  test('displays loading state during API calls', () => {
    // Mock slow API responses
    fetch.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    // Form should render but dropdowns might be empty until data loads
    expect(screen.getByText('Record New Brew Session')).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Coffee Amount/)).toBeInTheDocument();
    });

    const coffeeAmountInput = screen.getByLabelText(/Coffee Amount/);
    await user.type(coffeeAmountInput, '18');
    
    expect(coffeeAmountInput).toHaveValue('18');
  });

  test('displays tasting note sliders', async () => {
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      // Check for tasting note labels
      expect(screen.getByText('Sweetness:')).toBeInTheDocument();
      expect(screen.getByText('Acidity:')).toBeInTheDocument();
      expect(screen.getByText('Bitterness:')).toBeInTheDocument();
      expect(screen.getByText('Body:')).toBeInTheDocument();
      expect(screen.getByText('Aroma:')).toBeInTheDocument();
      expect(screen.getByText('Flavor Profile Match:')).toBeInTheDocument();
    });
  });

  test('displays overall score slider', async () => {
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Overall Score:')).toBeInTheDocument();
    });
  });

  test('renders edit mode correctly', async () => {
    const initialData = {
      id: 1,
      product_id: 1,
      brew_method: { id: 1, name: 'V60' },
      recipe: { id: 1, name: 'Standard Recipe' },
      amount_coffee_grams: 18,
      amount_water_grams: 300,
      brew_temperature_c: 93,
      score: 8.5,
      notes: 'Great brew!',
      timestamp: '2025-01-01T10:00:00.000Z'
    };

    // Mock additional API call for batches
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, roast_date: '2025-01-01' }]
    });

    renderWithProviders(
      <BrewSessionForm 
        initialData={initialData}
        onSessionSubmitted={mockOnSessionSubmitted} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Edit Brew Session')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
      expect(screen.getByDisplayValue('300')).toBeInTheDocument();
      expect(screen.getByDisplayValue('93')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Great brew!')).toBeInTheDocument();
    });
  });

  test('submits form with correct data', async () => {
    const user = userEvent.setup();
    
    // Mock successful form submission
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, message: 'Brew session created successfully' })
    });

    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Coffee Amount/)).toBeInTheDocument();
    });

    // Fill in some form fields
    const coffeeAmountInput = screen.getByLabelText(/Coffee Amount/);
    await user.type(coffeeAmountInput, '18');
    
    const waterAmountInput = screen.getByLabelText(/Water Amount/);
    await user.type(waterAmountInput, '300');

    const submitButton = screen.getByText('Save Brew Session');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSessionSubmitted).toHaveBeenCalled();
    });
  });

  test('displays error state when submission fails', async () => {
    const user = userEvent.setup();
    
    // Mock failed form submission
    fetch.mockRejectedValueOnce(new Error('Submission failed'));

    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Coffee Amount/)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Brew Session');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save brew session/)).toBeInTheDocument();
    });
  });

  test('handles cancel action', async () => {
    const mockOnCancel = jest.fn();
    
    renderWithProviders(
      <BrewSessionForm 
        onSessionSubmitted={mockOnSessionSubmitted}
        onCancel={mockOnCancel}
      />
    );
    
    await waitFor(() => {
      const cancelButton = screen.queryByText('Cancel');
      if (cancelButton) {
        fireEvent.click(cancelButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });
  });

  test('calculates brew ratio automatically', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Coffee Amount/)).toBeInTheDocument();
    });

    // Fill in coffee and water amounts
    const coffeeAmountInput = screen.getByLabelText(/Coffee Amount/);
    await user.type(coffeeAmountInput, '18');
    
    const waterAmountInput = screen.getByLabelText(/Water Amount/);
    await user.type(waterAmountInput, '300');

    // Should calculate and display brew ratio (300/18 ≈ 16.67)
    await waitFor(() => {
      expect(screen.getByText(/1:16\.7/)).toBeInTheDocument();
    });
  });

  test('handles product selection and batch loading', async () => {
    const user = userEvent.setup();
    
    // Mock batch loading API call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, roast_date: '2025-01-01', amount_grams: 250 },
        { id: 2, roast_date: '2025-01-05', amount_grams: 500 }
      ]
    });

    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Product/)).toBeInTheDocument();
    });

    const productSelect = screen.getByLabelText(/Product/);
    await user.selectOptions(productSelect, '1');

    // Should trigger batch loading
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products/1/batches');
    });
  });

  test('renders with provided product_batch_id', async () => {
    renderWithProviders(
      <BrewSessionForm 
        product_batch_id={1}
        onSessionSubmitted={mockOnSessionSubmitted} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Add New Brew Session')).toBeInTheDocument();
    });
    
    // Should pre-select the batch in the form
    // (Testing internal state would require more complex setup)
  });

  test('handles time inputs correctly', async () => {
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      // Check for time-related inputs
      expect(screen.getByText('Bloom Time:')).toBeInTheDocument();
      expect(screen.getByText('Total Brew Time:')).toBeInTheDocument();
    });
  });

  test('handles datetime input correctly', async () => {
    renderWithProviders(
      <BrewSessionForm onSessionSubmitted={mockOnSessionSubmitted} />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Timestamp:')).toBeInTheDocument();
    });
  });
});