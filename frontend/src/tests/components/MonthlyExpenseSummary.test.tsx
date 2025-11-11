import { render, screen } from "@testing-library/react";

import MonthlyExpenseSummary from "../../components/dashboard/MonthlyExpenseSummary.component";
import { useMonthlyComparison } from "../../hooks/useMonthlyComparison.hook";

// Mock du hook useMonthlyComparison
jest.mock("../../hooks/useMonthlyComparison.hook");

const mockUseMonthlyComparison = useMonthlyComparison as jest.MockedFunction<typeof useMonthlyComparison>;

describe("MonthlyExpenseSummary Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display skeleton loader when loading", () => {
      mockUseMonthlyComparison.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<MonthlyExpenseSummary />);
      const skeleton = container.querySelector(".animate-pulse");

      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message on error", () => {
      mockUseMonthlyComparison.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        mutate: jest.fn(),
      });

      render(<MonthlyExpenseSummary />);

      expect(screen.getByText(/Erreur lors du chargement des données/i)).toBeInTheDocument();
    });
  });

  describe("Display Financial Data", () => {
    beforeEach(() => {
      // Mock des 3 appels (depenses, revenus, solde)
      mockUseMonthlyComparison
        .mockReturnValueOnce({
          // Premier appel: depenses
          data: {
            totalMoisActuel: 1500.0,
            totalMoisPrecedent: 1200.0,
            difference: 300.0,
            pourcentageVariation: 25,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Deuxième appel: revenus
          data: {
            totalMoisActuel: 3000.0,
            totalMoisPrecedent: 2800.0,
            difference: 200.0,
            pourcentageVariation: 7.14,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Troisième appel: solde
          data: {
            totalMoisActuel: 1500.0,
            totalMoisPrecedent: 1600.0,
            difference: -100.0,
            pourcentageVariation: -6.25,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        });
    });

    it("should display revenus correctly", () => {
      render(<MonthlyExpenseSummary />);

      expect(screen.getByText("Revenus")).toBeInTheDocument();
      expect(screen.getByText("3000.00€")).toBeInTheDocument();
      expect(screen.getByText("+200.00€")).toBeInTheDocument();
    });

    it("should display depenses correctly", () => {
      render(<MonthlyExpenseSummary />);

      expect(screen.getByText("Dépenses")).toBeInTheDocument();
      expect(screen.getByText("1500.00€")).toBeInTheDocument();
      expect(screen.getByText("+300.00€")).toBeInTheDocument();
    });

    it("should display solde correctly", () => {
      render(<MonthlyExpenseSummary />);

      expect(screen.getByText("Solde")).toBeInTheDocument();
      // Le solde 1500€ peut apparaître plusieurs fois, on vérifie juste sa présence
      const soldeElements = screen.getAllByText(/1500\.00€/);
      expect(soldeElements.length).toBeGreaterThan(0);
    });

    it("should display variation with correct sign", () => {
      render(<MonthlyExpenseSummary />);

      // Variation revenus: positive (+)
      expect(screen.getByText("+200.00€")).toBeInTheDocument();

      // Variation dépenses: positive (+)
      expect(screen.getByText("+300.00€")).toBeInTheDocument();

      // Variation solde: négative (-)
      expect(screen.getByText("-100.00€")).toBeInTheDocument();
    });
  });

  describe("Positive Solde Styling", () => {
    beforeEach(() => {
      mockUseMonthlyComparison
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 500.0,
            totalMoisPrecedent: 500.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 2500.0,
            totalMoisPrecedent: 2500.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Solde positif
          data: {
            totalMoisActuel: 2000.0,
            totalMoisPrecedent: 1800.0,
            difference: 200.0,
            pourcentageVariation: 11.11,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        });
    });

    it("should apply indigo styling for positive solde", () => {
      const { container } = render(<MonthlyExpenseSummary />);

      // Le solde positif doit avoir les classes indigo
      const soldeCard = container.querySelector(".bg-indigo-50.border-indigo-300");
      expect(soldeCard).toBeInTheDocument();

      const soldeAmount = container.querySelector(".text-indigo-600.font-bold.text-2xl");
      expect(soldeAmount).toBeInTheDocument();
    });
  });

  describe("Negative Solde Styling", () => {
    beforeEach(() => {
      mockUseMonthlyComparison
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 2500.0,
            totalMoisPrecedent: 2000.0,
            difference: 500.0,
            pourcentageVariation: 25,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 1800.0,
            totalMoisPrecedent: 1800.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Solde négatif
          data: {
            totalMoisActuel: -700.0,
            totalMoisPrecedent: -200.0,
            difference: -500.0,
            pourcentageVariation: 250,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        });
    });

    it("should apply orange styling for negative solde", () => {
      const { container } = render(<MonthlyExpenseSummary />);

      // Le solde négatif doit avoir les classes orange
      const soldeCard = container.querySelector(".bg-orange-50.border-orange-300");
      expect(soldeCard).toBeInTheDocument();

      const soldeAmount = container.querySelector(".text-orange-600.font-bold.text-2xl");
      expect(soldeAmount).toBeInTheDocument();
    });
  });

  describe("Current Month Display", () => {
    beforeEach(() => {
      mockUseMonthlyComparison.mockReturnValue({
        data: {
          totalMoisActuel: 100.0,
          totalMoisPrecedent: 100.0,
          difference: 0,
          pourcentageVariation: 0,
        },
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });
    });

    it("should display current month name", () => {
      render(<MonthlyExpenseSummary />);

      const currentMonth = new Date().toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });

      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    });
  });

  describe("Sparkline Chart", () => {
    beforeEach(() => {
      mockUseMonthlyComparison
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 1000.0,
            totalMoisPrecedent: 1000.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 2000.0,
            totalMoisPrecedent: 2000.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: {
            totalMoisActuel: 1000.0,
            totalMoisPrecedent: 800.0,
            difference: 200.0,
            pourcentageVariation: 25,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        });
    });

    it("should display sparkline chart title", () => {
      render(<MonthlyExpenseSummary />);

      expect(screen.getByText("Évolution du solde")).toBeInTheDocument();
    });

    it("should render canvas for chart", () => {
      const { container } = render(<MonthlyExpenseSummary />);

      // Chart.js crée un canvas
      const canvas = container.querySelector("canvas");
      expect(canvas).toBeInTheDocument();
    });
  });

  describe("Trend Icons", () => {
    beforeEach(() => {
      mockUseMonthlyComparison
        .mockReturnValueOnce({
          // Dépenses en hausse (mauvais)
          data: {
            totalMoisActuel: 1500.0,
            totalMoisPrecedent: 1000.0,
            difference: 500.0,
            pourcentageVariation: 50,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Revenus en hausse (bon)
          data: {
            totalMoisActuel: 3000.0,
            totalMoisPrecedent: 2500.0,
            difference: 500.0,
            pourcentageVariation: 20,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          // Solde en baisse (mauvais)
          data: {
            totalMoisActuel: 1500.0,
            totalMoisPrecedent: 1500.0,
            difference: 0,
            pourcentageVariation: 0,
          },
          isLoading: false,
          isError: false,
          mutate: jest.fn(),
        });
    });

    it("should display trend icons (SVG elements)", () => {
      const { container } = render(<MonthlyExpenseSummary />);

      // Vérifie la présence de SVG (icônes de tendance)
      const svgElements = container.querySelectorAll("svg");
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  describe("Zero Values Handling", () => {
    beforeEach(() => {
      mockUseMonthlyComparison.mockReturnValue({
        data: {
          totalMoisActuel: 0,
          totalMoisPrecedent: 0,
          difference: 0,
          pourcentageVariation: 0,
        },
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });
    });

    it("should handle zero values without errors", () => {
      render(<MonthlyExpenseSummary />);

      expect(screen.getByText("Revenus")).toBeInTheDocument();
      expect(screen.getByText("Dépenses")).toBeInTheDocument();
      expect(screen.getByText("Solde")).toBeInTheDocument();
    });
  });
});
