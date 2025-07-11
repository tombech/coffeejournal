import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LookupManager from '../LookupManager';
import { ToastProvider } from '../Toast';

// Mock fetch
global.fetch = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('LookupManager Component - Generic Tests', () => {
  const mockOnNavigateBack = jest.fn();
  
  const customFields = [
    { name: 'custom_field', label: 'Custom Field', type: 'text', required: false }
  ];

  beforeEach(() => {
    fetch.mockClear();
    mockOnNavigateBack.mockClear();
  });

  describe('Basic CRUD Operations', () => {
    test('handles complete CRUD cycle', async () => {
      const user = userEvent.setup();
      
      // Mock API responses for full CRUD cycle
      fetch
        .mockResolvedValueOnce({ // Initial load - empty
          ok: true,
          json: async () => []
        })
        .mockResolvedValueOnce({ // Create
          ok: true,
          json: async () => ({ id: 1, name: 'Test Item', custom_field: 'Value' })
        })
        .mockResolvedValueOnce({ // Refresh after create
          ok: true,
          json: async () => [{ id: 1, name: 'Test Item', custom_field: 'Value' }]
        })
        .mockResolvedValueOnce({ // Update
          ok: true,
          json: async () => ({ id: 1, name: 'Updated Item', custom_field: 'New Value' })
        })
        .mockResolvedValueOnce({ // Refresh after update
          ok: true,
          json: async () => [{ id: 1, name: 'Updated Item', custom_field: 'New Value' }]
        })
        .mockResolvedValueOnce({ // Usage check for delete
          ok: true,
          json: async () => ({ in_use: false, usage_count: 0 })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Deleted successfully' })
        })
        .mockResolvedValueOnce({ // Refresh after delete
          ok: true,
          json: async () => []
        });

      renderWithProviders(
        <LookupManager
          title="Test Items"
          apiEndpoint="test-items"
          singularName="Test Item"
          onNavigateBack={mockOnNavigateBack}
          fields={customFields}
        />
      );

      // 1. CREATE
      await waitFor(() => {
        expect(screen.getByText('Test Items')).toBeInTheDocument();
      });

      // Open add form
      fireEvent.click(screen.getByTitle('Add Test Item'));
      
      // Fill form
      await user.type(screen.getByLabelText(/Name/), 'Test Item');
      await user.type(screen.getByLabelText(/Custom Field/), 'Value');
      
      // Submit
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });

      // 2. UPDATE
      fireEvent.click(screen.getByTitle('Edit Test Item'));
      
      // Clear and type new values
      const nameInput = screen.getByDisplayValue('Test Item');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Item');
      
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Updated Item')).toBeInTheDocument();
      });

      // 3. DELETE
      fireEvent.click(screen.getByTitle('Delete Updated Item'));

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Updated Item"/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Updated Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Field Types', () => {
    test('renders all field types correctly', async () => {
      const allFieldTypes = [
        { name: 'text_field', label: 'Text Field', type: 'text', required: true },
        { name: 'url_field', label: 'URL Field', type: 'url', required: false },
        { name: 'textarea_field', label: 'Textarea Field', type: 'textarea', required: false },
        { name: 'file_field', label: 'File Field', type: 'file', required: false }
      ];

      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(
        <LookupManager
          title="Field Test"
          apiEndpoint="field-test"
          singularName="Field Test"
          onNavigateBack={mockOnNavigateBack}
          fields={allFieldTypes}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Add Field Test')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Field Test'));

      // Check all fields are rendered
      expect(screen.getByLabelText(/Text Field/)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/URL Field/)).toHaveAttribute('type', 'url');
      expect(screen.getByLabelText(/Textarea Field/).tagName).toBe('TEXTAREA');
      expect(screen.getByLabelText(/File Field/)).toHaveAttribute('type', 'file');
    });
  });

  describe('Complex Deletion Scenarios', () => {
    test('handles all three deletion options for items in use', async () => {
      const user = userEvent.setup();
      
      // Test 1: Cancel deletion
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [
            { id: 1, name: 'Item One' },
            { id: 2, name: 'Item Two' }
          ]
        })
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 3, usage_type: 'products' })
        });

      const { rerender } = renderWithProviders(
        <LookupManager
          title="Test Items"
          apiEndpoint="test-items"
          singularName="Test Item"
          onNavigateBack={mockOnNavigateBack}
          fields={customFields}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Delete Item One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Item One'));

      await waitFor(() => {
        expect(screen.getByText(/This test item is currently being used in 3 products/)).toBeInTheDocument();
      });

      // Test cancel (default option)
      fireEvent.click(screen.getByRole('button', { name: /Cancel$/ }));

      await waitFor(() => {
        expect(screen.queryByText(/This test item is currently being used/)).not.toBeInTheDocument();
      });

      // Item should still exist
      expect(screen.getByText('Item One')).toBeInTheDocument();

      // Test 2: Remove references and delete
      fetch
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 2, usage_type: 'brew_sessions' })
        })
        .mockResolvedValueOnce({ // Update references
          ok: true,
          json: async () => ({ message: 'References removed' })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Deleted' })
        })
        .mockResolvedValueOnce({ // Refresh
          ok: true,
          json: async () => [{ id: 2, name: 'Item Two' }]
        });

      fireEvent.click(screen.getByTitle('Delete Item One'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Remove all references and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Remove all references and delete/));
      fireEvent.click(screen.getByRole('button', { name: 'Remove References & Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Item One')).not.toBeInTheDocument();
      });

      // Test 3: Replace and delete
      fetch
        .mockResolvedValueOnce({ // Initial load with 3 items
          ok: true,
          json: async () => [
            { id: 1, name: 'Item A' },
            { id: 2, name: 'Item B' },
            { id: 3, name: 'Item C' }
          ]
        });

      // Re-render to reset state
      rerender(
        <LookupManager
          title="Test Items"
          apiEndpoint="test-items"
          singularName="Test Item"
          onNavigateBack={mockOnNavigateBack}
          fields={customFields}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Item A')).toBeInTheDocument();
      });

      fetch
        .mockResolvedValueOnce({ // Usage check
          ok: true,
          json: async () => ({ in_use: true, usage_count: 5, usage_type: 'products' })
        })
        .mockResolvedValueOnce({ // Update references
          ok: true,
          json: async () => ({ message: 'References replaced' })
        })
        .mockResolvedValueOnce({ // Delete
          ok: true,
          json: async () => ({ message: 'Deleted' })
        })
        .mockResolvedValueOnce({ // Refresh
          ok: true,
          json: async () => [
            { id: 2, name: 'Item B' },
            { id: 3, name: 'Item C' }
          ]
        });

      fireEvent.click(screen.getByTitle('Delete Item A'));

      await waitFor(() => {
        expect(screen.getByLabelText(/Replace with another test item and delete/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Replace with another test item and delete/));

      // Select replacement
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      fireEvent.click(screen.getByRole('button', { name: 'Replace & Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Item A')).not.toBeInTheDocument();
      });

      // Verify API calls
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-items/1/update_references'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'replace', replacement_id: '2' })
        })
      );
    });

    test('handles deletion when usage check fails', async () => {
      fetch
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => [{ id: 1, name: 'Test Item' }]
        })
        .mockResolvedValueOnce({ // Usage check fails
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({ // Delete proceeds
          ok: true,
          json: async () => ({ message: 'Deleted' })
        })
        .mockResolvedValueOnce({ // Refresh
          ok: true,
          json: async () => []
        });

      renderWithProviders(
        <LookupManager
          title="Test Items"
          apiEndpoint="test-items"
          singularName="Test Item"
          onNavigateBack={mockOnNavigateBack}
          fields={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Delete Test Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Delete Test Item'));

      // Should show simple confirmation since usage check failed
      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete "Test Item"/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('validates all required fields', async () => {
      const fieldsWithValidation = [
        { name: 'required_text', label: 'Required Text', type: 'text', required: true },
        { name: 'optional_text', label: 'Optional Text', type: 'text', required: false }
      ];

      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(
        <LookupManager
          title="Validation Test"
          apiEndpoint="validation-test"
          singularName="Validation Item"
          onNavigateBack={mockOnNavigateBack}
          fields={fieldsWithValidation}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Add Validation Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Validation Item'));

      // Try to save without filling required fields
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/Name is required/)).toBeInTheDocument();
      });

      // Fill name but not custom required field
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/Name/), 'Test Name');
      
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/Required Text is required/)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    test('handles API errors gracefully', async () => {
      // Test load error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <LookupManager
          title="Error Test"
          apiEndpoint="error-test"
          singularName="Error Item"
          onNavigateBack={mockOnNavigateBack}
          fields={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch error test/)).toBeInTheDocument();
      });
    });

    test('handles create error', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Duplicate name' })
        });

      renderWithProviders(
        <LookupManager
          title="Error Test"
          apiEndpoint="error-test"
          singularName="Error Item"
          onNavigateBack={mockOnNavigateBack}
          fields={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Add Error Item')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Add Error Item'));
      await user.type(screen.getByLabelText(/Name/), 'Duplicate');
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to create error item: Duplicate name/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('calls navigation callback when back button clicked', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      renderWithProviders(
        <LookupManager
          title="Nav Test"
          apiEndpoint="nav-test"
          singularName="Nav Item"
          onNavigateBack={mockOnNavigateBack}
          fields={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByTitle('Back to Settings')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Back to Settings'));
      
      expect(mockOnNavigateBack).toHaveBeenCalledTimes(1);
    });
  });
});