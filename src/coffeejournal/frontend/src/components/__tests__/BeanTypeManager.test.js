import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BeanTypeManager from '../lookup/BeanTypeManager';
import { ToastProvider } from '../Toast';

// Mock fetch
global.fetch = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('BeanTypeManager Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  test('renders bean types with species and variety fields', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: 'Arabica', species: 'Coffea arabica', variety: 'Typica' },
        { id: 2, name: 'Robusta', species: 'Coffea canephora', variety: 'Robusta' }
      ]
    });

    renderWithProviders(<BeanTypeManager />);

    await waitFor(() => {
      expect(screen.getByText('Bean Types')).toBeInTheDocument();
      expect(screen.getByText('Arabica')).toBeInTheDocument();
      expect(screen.getByText('Robusta')).toBeInTheDocument();
    });
  });

  test('creates bean type with species and variety', async () => {
    const user = userEvent.setup();
    
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 3, 
          name: 'Liberica', 
          species: 'Coffea liberica',
          variety: 'Liberica'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 3, name: 'Liberica', species: 'Coffea liberica', variety: 'Liberica' }
        ]
      });

    renderWithProviders(<BeanTypeManager />);

    await waitFor(() => {
      expect(screen.getByTitle('Add Bean Type')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Add Bean Type'));

    await user.type(screen.getByLabelText(/Name/), 'Liberica');
    await user.type(screen.getByLabelText(/Species/), 'Coffea liberica');
    await user.type(screen.getByLabelText(/Variety/), 'Liberica');

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Liberica')).toBeInTheDocument();
    });
  });

  test('handles bean type in use by multiple products', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Arabica' },
          { id: 2, name: 'Robusta' }
        ]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          in_use: true, 
          usage_count: 10, 
          usage_type: 'products',
          details: 'Used in 10 coffee products'
        })
      });

    renderWithProviders(<BeanTypeManager />);

    await waitFor(() => {
      expect(screen.getByTitle('Delete Arabica')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Delete Arabica'));

    await waitFor(() => {
      expect(screen.getByText(/This bean type is currently being used in 10 products/)).toBeInTheDocument();
    });

    // Should offer replacement with Robusta
    expect(screen.getByLabelText(/Replace with another bean type and delete/)).toBeInTheDocument();
  });
});