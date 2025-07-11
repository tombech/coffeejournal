import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

// Mock fetch
global.fetch = jest.fn();

describe('DeleteConfirmationModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnDeleteConfirmed = jest.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    item: { id: 1, name: 'Test Item' },
    itemType: 'Test Type',
    apiEndpoint: 'test-endpoint',
    usageInfo: { in_use: false, usage_count: 0, usage_type: null },
    onDeleteConfirmed: mockOnDeleteConfirmed,
    availableReplacements: []
  };

  beforeEach(() => {
    fetch.mockClear();
    mockOnClose.mockClear();
    mockOnDeleteConfirmed.mockClear();
  });

  describe('Not In Use Scenarios', () => {
    test('shows simple confirmation when item not in use', () => {
      render(<DeleteConfirmationModal {...defaultProps} />);

      expect(screen.getByText('Delete Test Type: "Test Item"')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "Test Item"\? This action cannot be undone./)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    test('deletes item when not in use', async () => {
      mockOnDeleteConfirmed.mockResolvedValueOnce();
      
      render(<DeleteConfirmationModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockOnDeleteConfirmed).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('closes modal when cancel clicked', () => {
      render(<DeleteConfirmationModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnDeleteConfirmed).not.toHaveBeenCalled();
    });

    test('closes modal when clicking backdrop', () => {
      const { container } = render(<DeleteConfirmationModal {...defaultProps} />);

      // Click the backdrop (outer div)
      const backdrop = container.firstChild;
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('In Use Scenarios', () => {
    const inUseProps = {
      ...defaultProps,
      usageInfo: { in_use: true, usage_count: 5, usage_type: 'products' },
      availableReplacements: [
        { id: 2, name: 'Replacement Item 1' },
        { id: 3, name: 'Replacement Item 2' }
      ]
    };

    test('shows usage warning and options when item in use', () => {
      render(<DeleteConfirmationModal {...inUseProps} />);

      expect(screen.getByText(/This test type is currently being used in 5 products/)).toBeInTheDocument();
      expect(screen.getByText('Choose how to proceed:')).toBeInTheDocument();
      
      expect(screen.getByLabelText(/Cancel deletion/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remove all references and delete/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Replace with another test type and delete/)).toBeInTheDocument();
    });

    test('shows correct usage description for single item', () => {
      const singleUseProps = {
        ...inUseProps,
        usageInfo: { in_use: true, usage_count: 1, usage_type: 'brew_sessions' }
      };

      render(<DeleteConfirmationModal {...singleUseProps} />);

      expect(screen.getByText(/This test type is currently being used in 1 brew session/)).toBeInTheDocument();
    });

    test('cancel option is selected by default', () => {
      render(<DeleteConfirmationModal {...inUseProps} />);

      const cancelRadio = screen.getByLabelText(/Cancel deletion/);
      expect(cancelRadio).toBeChecked();

      // Confirm button should show appropriate text
      expect(screen.getByRole('button', { name: 'Choose an option above' })).toBeDisabled();
    });

    test('removes references when remove option selected', async () => {
      mockOnDeleteConfirmed.mockResolvedValueOnce();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'References removed' })
      });

      render(<DeleteConfirmationModal {...inUseProps} />);

      fireEvent.click(screen.getByLabelText(/Remove all references and delete/));
      
      const confirmButton = screen.getByRole('button', { name: 'Remove References & Delete' });
      expect(confirmButton).toBeEnabled();

      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint/1/update_references'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', replacement_id: null })
          })
        );
        expect(mockOnDeleteConfirmed).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('shows replacement dropdown when replace option selected', async () => {
      const user = userEvent.setup();
      
      render(<DeleteConfirmationModal {...inUseProps} />);

      fireEvent.click(screen.getByLabelText(/Replace with another test type and delete/));

      const dropdown = screen.getByRole('combobox');
      expect(dropdown).toBeInTheDocument();
      expect(screen.getByText('Select replacement...')).toBeInTheDocument();

      // Should not include the item being deleted
      expect(screen.getByRole('option', { name: 'Replacement Item 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Replacement Item 2' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Test Item' })).not.toBeInTheDocument();
    });

    test('disables confirm until replacement selected', async () => {
      const user = userEvent.setup();
      
      render(<DeleteConfirmationModal {...inUseProps} />);

      fireEvent.click(screen.getByLabelText(/Replace with another test type and delete/));

      const confirmButton = screen.getByRole('button', { name: 'Replace & Delete' });
      expect(confirmButton).toBeDisabled();

      // Select a replacement
      const dropdown = screen.getByRole('combobox');
      await user.selectOptions(dropdown, '2');

      expect(confirmButton).toBeEnabled();
    });

    test('replaces references when replace option confirmed', async () => {
      const user = userEvent.setup();
      mockOnDeleteConfirmed.mockResolvedValueOnce();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'References replaced' })
      });

      render(<DeleteConfirmationModal {...inUseProps} />);

      fireEvent.click(screen.getByLabelText(/Replace with another test type and delete/));
      
      const dropdown = screen.getByRole('combobox');
      await user.selectOptions(dropdown, '3');

      fireEvent.click(screen.getByRole('button', { name: 'Replace & Delete' }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/test-endpoint/1/update_references'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'replace', replacement_id: '3' })
          })
        );
        expect(mockOnDeleteConfirmed).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('hides replace option when no replacements available', () => {
      const noReplacementsProps = {
        ...inUseProps,
        availableReplacements: []
      };

      render(<DeleteConfirmationModal {...noReplacementsProps} />);

      expect(screen.getByLabelText(/Cancel deletion/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remove all references and delete/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Replace with another test type and delete/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('shows error when update references fails', async () => {
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const props = {
        ...defaultProps,
        usageInfo: { in_use: true, usage_count: 2, usage_type: 'products' }
      };

      render(<DeleteConfirmationModal {...props} />);

      fireEvent.click(screen.getByLabelText(/Remove all references and delete/));
      fireEvent.click(screen.getByRole('button', { name: 'Remove References & Delete' }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error: Network error');
        expect(mockOnDeleteConfirmed).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });

    test('shows processing state during operation', async () => {
      mockOnDeleteConfirmed.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<DeleteConfirmationModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      // Should show processing state
      expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('does not render when not open', () => {
      const closedProps = { ...defaultProps, isOpen: false };
      
      const { container } = render(<DeleteConfirmationModal {...closedProps} />);
      
      expect(container.firstChild).toBeNull();
    });

    test('does not render when item is null', () => {
      const noItemProps = { ...defaultProps, item: null };
      
      const { container } = render(<DeleteConfirmationModal {...noItemProps} />);
      
      expect(container.firstChild).toBeNull();
    });

    test('handles unknown usage types', () => {
      const unknownUsageProps = {
        ...defaultProps,
        usageInfo: { in_use: true, usage_count: 3, usage_type: 'custom_type' }
      };

      render(<DeleteConfirmationModal {...unknownUsageProps} />);

      expect(screen.getByText(/This test type is currently being used in 3 custom type/)).toBeInTheDocument();
    });
  });
});