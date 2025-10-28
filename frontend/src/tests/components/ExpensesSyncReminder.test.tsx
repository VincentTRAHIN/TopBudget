import { render, screen } from '@testing-library/react';
import ExpensesSyncReminder from '../../components/dashboard/ExpensesSyncReminder.component';
import { useLastSync } from '../../hooks/useLastSync.hook';

// Mock du hook useLastSync
jest.mock('../../hooks/useLastSync.hook');

const mockUseLastSync = useLastSync as jest.MockedFunction<typeof useLastSync>;

describe('ExpensesSyncReminder Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton loader when loading', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: null,
        lastRevenueDate: null,
        lastActivityDate: null,
        daysSinceLastExpense: null,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: null,
        needsUpdate: false,
        isLoading: true,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesSyncReminder />);
      const skeleton = container.querySelector('.animate-pulse');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('bg-gray-100');
    });
  });

  describe('Error State', () => {
    it('should not display anything on error', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: null,
        lastRevenueDate: null,
        lastActivityDate: null,
        daysSinceLastExpense: null,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: null,
        needsUpdate: false,
        isLoading: false,
        isError: true,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesSyncReminder />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('No Update Needed', () => {
    it('should not display anything when needsUpdate is false', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-27'),
        lastRevenueDate: new Date('2025-10-26'),
        lastActivityDate: new Date('2025-10-27'),
        daysSinceLastExpense: 1,
        daysSinceLastRevenue: 2,
        daysSinceLastActivity: 1,
        needsUpdate: false,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesSyncReminder />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Update Needed - Display Alert', () => {
    it('should display reminder alert when needsUpdate is true (8 days)', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-20'),
        lastRevenueDate: null,
        lastActivityDate: new Date('2025-10-20'),
        daysSinceLastExpense: 8,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: 8,
        needsUpdate: true,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<ExpensesSyncReminder />);

      expect(screen.getByText('Rappel de synchronisation')).toBeInTheDocument();
      expect(screen.getByText(/8 jours/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /que vous n'avez pas enregistré de dépenses ou de revenus/i
        )
      ).toBeInTheDocument();
    });

    it('should display "jour" (singular) when daysSinceLastActivity is 1', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-27'),
        lastRevenueDate: null,
        lastActivityDate: new Date('2025-10-27'),
        daysSinceLastExpense: 1,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: 1,
        needsUpdate: true, // Force affichage pour test
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<ExpensesSyncReminder />);

      // Vérifie que c'est "1 jour" et non "1 jours"
      const text = screen.getByText(/1 jour/i).textContent;
      expect(text).toMatch(/1 jour[^s]/); // Pas de "s" après "jour"
    });

    it('should display action buttons with correct links', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-15'),
        lastRevenueDate: new Date('2025-10-14'),
        lastActivityDate: new Date('2025-10-15'),
        daysSinceLastExpense: 13,
        daysSinceLastRevenue: 14,
        daysSinceLastActivity: 13,
        needsUpdate: true,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<ExpensesSyncReminder />);

      const importButton = screen.getByLabelText(
        /Importer des dépenses depuis un fichier CSV/i
      );
      const addButton = screen.getByLabelText(/Ajouter une nouvelle dépense/i);

      expect(importButton).toHaveAttribute('href', '/depenses?action=import');
      expect(addButton).toHaveAttribute('href', '/depenses?action=add');

      expect(screen.getByText('Importer CSV')).toBeInTheDocument();
      expect(screen.getByText('Ajouter une dépense')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-10'),
        lastRevenueDate: null,
        lastActivityDate: new Date('2025-10-10'),
        daysSinceLastExpense: 18,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: 18,
        needsUpdate: true,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<ExpensesSyncReminder />);

      const alert = screen.getByRole('alert');

      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-labelledby', 'sync-reminder-title');
    });

    it('should have proper button labels for screen readers', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-10'),
        lastRevenueDate: null,
        lastActivityDate: new Date('2025-10-10'),
        daysSinceLastExpense: 18,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: 18,
        needsUpdate: true,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<ExpensesSyncReminder />);

      const importButton = screen.getByLabelText(
        /Importer des dépenses depuis un fichier CSV/i
      );
      const addButton = screen.getByLabelText(/Ajouter une nouvelle dépense/i);

      expect(importButton).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply correct color theme classes', () => {
      mockUseLastSync.mockReturnValue({
        lastExpenseDate: new Date('2025-10-10'),
        lastRevenueDate: null,
        lastActivityDate: new Date('2025-10-10'),
        daysSinceLastExpense: 10,
        daysSinceLastRevenue: null,
        daysSinceLastActivity: 10,
        needsUpdate: true,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesSyncReminder />);
      const alert = screen.getByRole('alert');

      expect(alert).toHaveClass('bg-amber-50');
      expect(alert).toHaveClass('border-amber-400');

      // Vérifier les classes de couleur des boutons
      const importButton = screen.getByText('Importer CSV').closest('a');
      const addButton = screen.getByText('Ajouter une dépense').closest('a');

      expect(importButton).toHaveClass('bg-amber-600');
      expect(addButton).toHaveClass('border-amber-600');
    });
  });
});
