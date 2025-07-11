import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import GrinderManager from '../lookup/GrinderManager';
import FilterManager from '../lookup/FilterManager';
import KettleManager from '../lookup/KettleManager';
import ScaleManager from '../lookup/ScaleManager';
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

describe('Equipment Manager Components', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  describe('GrinderManager', () => {
    test('creates grinder with manufacturer and model', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            id: 1, 
            name: 'Comandante C40', 
            manufacturer: 'Comandante',
            model: 'C40 MK3'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Comandante C40', manufacturer: 'Comandante', model: 'C40 MK3' }
          ]
        });

      renderWithProviders(<GrinderManager />);

      await waitFor(() => {
        expect(screen.getByText('Grinders')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Grinder'));

      await user.type(screen.getByLabelText(/Name/), 'Comandante C40');
      await user.type(screen.getByLabelText(/Manufacturer/), 'Comandante');
      await user.type(screen.getByLabelText(/Model/), 'C40 MK3');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Comandante C40')).toBeInTheDocument();
      });
    });

    test('handles grinder in use by brew sessions', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Comandante C40' },
            { id: 2, name: 'Baratza Encore' }
          ]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            in_use: true, 
            usage_count: 15, 
            usage_type: 'brew_sessions'
          })
        });

      renderWithProviders(<GrinderManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Comandante C40')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Comandante C40'));

      await waitFor(() => {
        expect(screen.getByText(/This grinder is currently being used in 15 brew sessions/)).toBeInTheDocument();
      });
    });
  });

  describe('FilterManager', () => {
    test('creates filter with filter type', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            id: 1, 
            name: 'Hario V60 Filters', 
            filter_type: 'Paper - Bleached'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Hario V60 Filters', filter_type: 'Paper - Bleached' }
          ]
        });

      renderWithProviders(<FilterManager />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Filter'));

      await user.type(screen.getByLabelText(/Name/), 'Hario V60 Filters');
      await user.type(screen.getByLabelText(/Filter Type/), 'Paper - Bleached');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Hario V60 Filters')).toBeInTheDocument();
      });
    });
  });

  describe('KettleManager', () => {
    test('creates kettle with capacity', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            id: 1, 
            name: 'Fellow Stagg EKG', 
            capacity_ml: 900
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Fellow Stagg EKG', capacity_ml: 900 }
          ]
        });

      renderWithProviders(<KettleManager />);

      await waitFor(() => {
        expect(screen.getByText('Kettles')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Kettle'));

      await user.type(screen.getByLabelText(/Name/), 'Fellow Stagg EKG');
      await user.type(screen.getByLabelText(/Capacity \(ml\)/), '900');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Fellow Stagg EKG')).toBeInTheDocument();
      });
    });
  });

  describe('ScaleManager', () => {
    test('creates scale with precision', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            id: 1, 
            name: 'Acaia Pearl', 
            precision_g: 0.1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Acaia Pearl', precision_g: 0.1 }
          ]
        });

      renderWithProviders(<ScaleManager />);

      await waitFor(() => {
        expect(screen.getByText('Scales')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Scale'));

      await user.type(screen.getByLabelText(/Name/), 'Acaia Pearl');
      await user.type(screen.getByLabelText(/Precision \(g\)/), '0.1');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Acaia Pearl')).toBeInTheDocument();
      });
    });

    test('validates numeric precision field', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(<ScaleManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Add Scale')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Scale'));

      await user.type(screen.getByLabelText(/Name/), 'Test Scale');
      
      // Precision field should accept numbers
      const precisionInput = screen.getByLabelText(/Precision \(g\)/);
      expect(precisionInput).toHaveAttribute('type', 'number');
    });
  });

  describe('Equipment Replacement Scenarios', () => {
    test('replaces grinder references in brew sessions', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 1, name: 'Old Grinder' },
            { id: 2, name: 'New Grinder' }
          ]
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            in_use: true, 
            usage_count: 5, 
            usage_type: 'brew_sessions'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'References updated' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Deleted' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { id: 2, name: 'New Grinder' }
          ]
        });

      renderWithProviders(<GrinderManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Old Grinder')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Old Grinder'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Replace with another grinder and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Replace with another grinder and delete/));
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      fireEvent.click(screen.getByRole('button', { name: 'Replace & Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Old Grinder')).not.toBeInTheDocument();
        expect(screen.getByText('New Grinder')).toBeInTheDocument();
      });

      // Verify correct API call
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/grinders/1/update_references'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'replace', replacement_id: '2' })
        })
      );
    });
  });
});