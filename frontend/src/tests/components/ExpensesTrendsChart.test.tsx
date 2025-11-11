import { render, screen } from "@testing-library/react";

import ExpensesTrendsChart from "../../components/statistiques/ExpensesTrendsChart.component";
import { useExpensesTrends } from "../../hooks/useExpensesTrends.hook";

// Mock du hook useExpensesTrends
jest.mock("../../hooks/useExpensesTrends.hook");

// Mock de Chart.js
jest.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="line-chart">Line Chart Mock</div>,
}));

const mockUseExpensesTrends = useExpensesTrends as jest.MockedFunction<typeof useExpensesTrends>;

describe("ExpensesTrendsChart Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("États de chargement et d'erreur", () => {
    it("should display loading skeleton when isLoading is true", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: true,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
      const skeleton = document.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("should display error message when isError is true", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: false,
        isError: true,
        error: new Error("Test error"),
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("Erreur de chargement")).toBeInTheDocument();
      expect(screen.getByText("Impossible de récupérer les tendances de dépenses")).toBeInTheDocument();
    });

    it("should display empty state when no data is available", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: { topCategories: [], evolutionMensuelle: [] },
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("Tendances de Dépenses")).toBeInTheDocument();
      expect(screen.getByText("Aucune donnée disponible pour la période sélectionnée")).toBeInTheDocument();
    });
  });

  describe("Affichage des données", () => {
    const mockData = {
      topCategories: [
        {
          categorieId: "1",
          nom: "Alimentation",
          totalActuel: 500,
          totalPrecedent: 450,
          variation: 50,
          variationPourcent: 11.11,
          tendance: "hausse" as const,
        },
        {
          categorieId: "2",
          nom: "Transport",
          totalActuel: 200,
          totalPrecedent: 250,
          variation: -50,
          variationPourcent: -20,
          tendance: "baisse" as const,
        },
        {
          categorieId: "3",
          nom: "Loisirs",
          totalActuel: 150,
          totalPrecedent: 148,
          variation: 2,
          variationPourcent: 1.35,
          tendance: "stable" as const,
        },
      ],
      evolutionMensuelle: [
        {
          mois: 1,
          annee: 2024,
          categories: [
            { categorieId: "1", nom: "Alimentation", total: 450 },
            { categorieId: "2", nom: "Transport", total: 250 },
            { categorieId: "3", nom: "Loisirs", total: 148 },
          ],
        },
        {
          mois: 2,
          annee: 2024,
          categories: [
            { categorieId: "1", nom: "Alimentation", total: 500 },
            { categorieId: "2", nom: "Transport", total: 200 },
            { categorieId: "3", nom: "Loisirs", total: 150 },
          ],
        },
      ],
    };

    it("should render chart with data", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: mockData,
        topCategories: mockData.topCategories,
        evolutionMensuelle: mockData.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("Tendances de Dépenses")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should display category names", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: mockData,
        topCategories: mockData.topCategories,
        evolutionMensuelle: mockData.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("Alimentation")).toBeInTheDocument();
      expect(screen.getByText("Transport")).toBeInTheDocument();
      expect(screen.getByText("Loisirs")).toBeInTheDocument();
    });

    it("should display category amounts", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: mockData,
        topCategories: mockData.topCategories,
        evolutionMensuelle: mockData.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("500.00 €")).toBeInTheDocument();
      expect(screen.getByText("200.00 €")).toBeInTheDocument();
      expect(screen.getByText("150.00 €")).toBeInTheDocument();
    });

    it("should display variation percentages", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: mockData,
        topCategories: mockData.topCategories,
        evolutionMensuelle: mockData.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      expect(screen.getByText("11%")).toBeInTheDocument();
      expect(screen.getByText("20%")).toBeInTheDocument();
      expect(screen.getByText("1%")).toBeInTheDocument();
    });

    it("should display correct trend icons", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: mockData,
        topCategories: mockData.topCategories,
        evolutionMensuelle: mockData.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesTrendsChart />);

      // Vérifier la présence des icônes SVG
      const svgIcons = container.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Props et configuration", () => {
    it("should use default props when not provided", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: true,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      // Vérifier que le hook est appelé avec les valeurs par défaut
      expect(mockUseExpensesTrends).toHaveBeenCalledWith("moi", 6);
    });

    it("should accept custom contexte prop", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: true,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart contexte="couple" />);

      expect(mockUseExpensesTrends).toHaveBeenCalledWith("couple", 6);
    });

    it("should accept custom nbMois prop", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: true,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart nbMois={12} />);

      expect(mockUseExpensesTrends).toHaveBeenCalledWith("moi", 12);
    });

    it("should display correct subtitle with nbMois", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: {
          topCategories: [],
          evolutionMensuelle: [
            {
              mois: 1,
              annee: 2024,
              categories: [],
            },
          ],
        },
        topCategories: [],
        evolutionMensuelle: [
          {
            mois: 1,
            annee: 2024,
            categories: [],
          },
        ],
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart nbMois={12} />);

      expect(screen.getByText("Évolution des top 5 catégories sur 12 mois")).toBeInTheDocument();
    });
  });

  describe("Gestion des catégories", () => {
    it("should display only top 5 categories", () => {
      const manyCategories = {
        topCategories: Array.from({ length: 10 }, (_, i) => ({
          categorieId: `${i + 1}`,
          nom: `Catégorie ${i + 1}`,
          totalActuel: 100 - i * 5,
          totalPrecedent: 90 - i * 5,
          variation: 10,
          variationPourcent: 11.11,
          tendance: "hausse" as const,
        })),
        evolutionMensuelle: [
          {
            mois: 1,
            annee: 2024,
            categories: Array.from({ length: 10 }, (_, i) => ({
              categorieId: `${i + 1}`,
              nom: `Catégorie ${i + 1}`,
              total: 100 - i * 5,
            })),
          },
        ],
      };

      mockUseExpensesTrends.mockReturnValue({
        data: manyCategories,
        topCategories: manyCategories.topCategories,
        evolutionMensuelle: manyCategories.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      render(<ExpensesTrendsChart />);

      // Vérifier que seulement 5 catégories sont affichées dans les indicateurs
      expect(screen.getByText("Catégorie 1")).toBeInTheDocument();
      expect(screen.getByText("Catégorie 5")).toBeInTheDocument();
      expect(screen.queryByText("Catégorie 6")).not.toBeInTheDocument();
    });
  });

  describe("Styling et classes CSS", () => {
    it("should have correct container classes", () => {
      mockUseExpensesTrends.mockReturnValue({
        data: undefined,
        topCategories: [],
        evolutionMensuelle: [],
        isLoading: true,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesTrendsChart />);
      const mainDiv = container.querySelector(".bg-white.rounded-lg.shadow-md");

      expect(mainDiv).toBeInTheDocument();
    });

    it("should apply correct trend colors", () => {
      const mockDataWithTrends = {
        topCategories: [
          {
            categorieId: "1",
            nom: "Hausse",
            totalActuel: 500,
            totalPrecedent: 400,
            variation: 100,
            variationPourcent: 25,
            tendance: "hausse" as const,
          },
          {
            categorieId: "2",
            nom: "Baisse",
            totalActuel: 300,
            totalPrecedent: 400,
            variation: -100,
            variationPourcent: -25,
            tendance: "baisse" as const,
          },
          {
            categorieId: "3",
            nom: "Stable",
            totalActuel: 200,
            totalPrecedent: 198,
            variation: 2,
            variationPourcent: 1,
            tendance: "stable" as const,
          },
        ],
        evolutionMensuelle: [
          {
            mois: 1,
            annee: 2024,
            categories: [
              { categorieId: "1", nom: "Hausse", total: 400 },
              { categorieId: "2", nom: "Baisse", total: 400 },
              { categorieId: "3", nom: "Stable", total: 198 },
            ],
          },
        ],
      };

      mockUseExpensesTrends.mockReturnValue({
        data: mockDataWithTrends,
        topCategories: mockDataWithTrends.topCategories,
        evolutionMensuelle: mockDataWithTrends.evolutionMensuelle,
        isLoading: false,
        isError: false,
        error: undefined,
        mutate: jest.fn(),
      });

      const { container } = render(<ExpensesTrendsChart />);

      // Vérifier la présence des classes de couleur
      expect(container.querySelector(".text-red-600")).toBeInTheDocument();
      expect(container.querySelector(".text-green-600")).toBeInTheDocument();
      expect(container.querySelector(".text-gray-600")).toBeInTheDocument();
    });
  });
});
