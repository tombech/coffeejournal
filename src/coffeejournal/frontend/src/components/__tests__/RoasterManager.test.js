import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import RoasterManager from '../lookup/RoasterManager';
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

describe('RoasterManager Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
  });

  describe('Display and Navigation', () => {
    test('renders roaster list correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Blue Bottle Coffee', location: 'Oakland, CA', website: 'https://bluebottlecoffee.com' },
          { id: 2, name: 'Intelligentsia', location: 'Chicago, IL', website: 'https://www.intelligentsia.com' }
        ]
      });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByText('Roasters')).toBeInTheDocument();
        expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
        expect(screen.getByText('Intelligentsia')).toBeInTheDocument();
      });
    });

    test('navigates back to settings when back button clicked', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Back to Settings')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Back to Settings'));
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Add Roaster', () => {
    test('shows add form when add button clicked', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Add Roaster')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Roaster'));
      
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Specialty\/Focus/)).toBeInTheDocument();
    });

    test('creates new roaster successfully', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
        .mockResolvedValueOnce({ // Create roaster
          ok: true,
          json: async () => ({ id: 3, name: 'Counter Culture', location: 'Durham, NC' })
        })
        .mockResolvedValueOnce({ // Refresh list
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 3, name: 'Counter Culture', location: 'Durham, NC' }
          ]
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Add Roaster')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Roaster'));

      await user.type(screen.getByLabelText(/Name/), 'Counter Culture');
      await user.type(screen.getByLabelText(/Location/), 'Durham, NC');
      await user.type(screen.getByLabelText(/Website/), 'https://counterculturecoffee.com');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Counter Culture')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/roasters'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Counter Culture')
        })
      );
    });

    test('validates required fields', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Add Roaster')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Roaster'));
      
      // Try to submit without filling required name field
      fireEvent.click(screen.getByText('Save'));

      // Should show error for required field
      await waitFor(() => {
        expect(screen.getByText(/Name is required/)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Roaster', () => {
    test('shows edit form with existing data', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'Blue Bottle Coffee', location: 'Oakland, CA', website: 'https://bluebottlecoffee.com' }
        ]
      });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Edit Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Edit Blue Bottle Coffee'));

      expect(screen.getByDisplayValue('Blue Bottle Coffee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Oakland, CA')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://bluebottlecoffee.com')).toBeInTheDocument();
    });

    test('updates roaster successfully', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee', location: 'Oakland, CA' }
          ]
        })
        .mockResolvedValueOnce({ // Update roaster
          ok: true,
          json: async () => ({ id: 1, name: 'Blue Bottle Coffee', location: 'San Francisco, CA' })
        })
        .mockResolvedValueOnce({ // Refresh list
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee', location: 'San Francisco, CA' }
          ]
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Edit Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Edit Blue Bottle Coffee'));

      const locationInput = screen.getByDisplayValue('Oakland, CA');
      await user.clear(locationInput);
      await user.type(locationInput, 'San Francisco, CA');

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Oakland, CA')).not.toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/roasters/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  describe('Delete Roaster - Not In Use', () => {
    test('deletes roaster not in use', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 2, name: 'Intelligentsia' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: false, usage_count: 0, usage_type: null })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Roaster deleted successfully' })
        })
        .mockResolvedValueOnce({ // Refresh list
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' }
          ]
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Intelligentsia')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Intelligentsia'));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Intelligentsia"/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Intelligentsia')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Roaster - In Use', () => {
    test('shows options when roaster is in use', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 2, name: 'Intelligentsia' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 5, usage_type: 'products' })
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByText(/This roaster is currently being used in 5 products/)).toBeInTheDocument();
      });

      // Check all options are available
      expect(screen.getByLabelText(/Cancel deletion/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remove all references and delete/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Replace with another roaster and delete/)).toBeInTheDocument();
    });

    test('cancels deletion when cancel option selected', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 3, usage_type: 'products' })
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Cancel deletion/)).toBeInTheDocument();
      });

      // Cancel option is selected by default
      fireEvent.click(screen.getByRole('button', { name: /Cancel$/ }));

      await waitFor(() => {
        expect(screen.queryByText(/This roaster is currently being used/)).not.toBeInTheDocument();
      });

      // Roaster should still be in the list
      expect(screen.getByText('Blue Bottle Coffee')).toBeInTheDocument();
    });

    test('removes references and deletes', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 2, usage_type: 'products' })
        })
        .mockResolvedValueOnce({ // Update references
          ok: true,
          json: async () => ({ message: 'References updated' })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Roaster deleted' })
        })
        .mockResolvedValueOnce({ // Refresh list
          ok: true,
          json: async () => []
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Remove all references and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Remove all references and delete/));
      fireEvent.click(screen.getByRole('button', { name: 'Remove References & Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Blue Bottle Coffee')).not.toBeInTheDocument();
      });

      // Check that update_references was called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/roasters/1/update_references'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'remove', replacement_id: null })
        })
      );
    });

    test('replaces references with another roaster and deletes', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 2, name: 'Intelligentsia' },
            { id: 3, name: 'Stumptown' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 4, usage_type: 'products' })
        })
        .mockResolvedValueOnce({ // Update references
          ok: true,
          json: async () => ({ message: 'References updated' })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Roaster deleted' })
        })
        .mockResolvedValueOnce({ // Refresh list
          ok: true,
          json: async () => [
            { id: 2, name: 'Intelligentsia' },
            { id: 3, name: 'Stumptown' }
          ]
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Replace with another roaster and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Replace with another roaster and delete/));

      // Select replacement
      const replacementSelect = screen.getByRole('combobox');
      await user.selectOptions(replacementSelect, '2');

      fireEvent.click(screen.getByRole('button', { name: 'Replace & Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Blue Bottle Coffee')).not.toBeInTheDocument();
      });

      // Check that update_references was called with replacement
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/roasters/1/update_references'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'replace', replacement_id: '2' })
        })
      );
    });

    test('disables confirm button when replace selected but no replacement chosen', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Blue Bottle Coffee' },
            { id: 2, name: 'Intelligentsia' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 1, usage_type: 'products' })
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Replace with another roaster and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Replace with another roaster and delete/));

      const confirmButton = screen.getByRole('button', { name: 'Replace & Delete' });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('shows error when create fails', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Name already exists' })
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Add Roaster')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Roaster'));
      await user.type(screen.getByLabelText(/Name/), 'Duplicate Name');
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to create roaster: Name already exists/)).toBeInTheDocument();
      });
    });

    test('shows error when delete fails', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [{ id: 1, name: 'Blue Bottle Coffee' }]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: false, usage_count: 0 })
        })
        .mockResolvedValueOnce({ // Delete fails
          ok: false,
          json: async () => ({ message: 'Database error' })
        });

      renderWithProviders(<RoasterManager />);

      await waitFor(() => {
        expect(screen.getByTitle('Delete Blue Bottle Coffee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Blue Bottle Coffee'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete roaster: Database error/)).toBeInTheDocument();
      });
    });
  });
});