import { render, screen } from "@testing-library/react";

import QuickActionsPanel from "../../components/dashboard/QuickActionsPanel.component";

describe("QuickActionsPanel Component", () => {
  describe("Rendering", () => {
    it("should render the panel with title and description", () => {
      render(<QuickActionsPanel />);

      expect(screen.getByText("Actions rapides")).toBeInTheDocument();
      expect(screen.getByText("Accès rapide aux fonctionnalités principales")).toBeInTheDocument();
    });

    it("should render all 4 quick action buttons", () => {
      render(<QuickActionsPanel />);

      expect(screen.getByText("Ajouter une dépense")).toBeInTheDocument();
      expect(screen.getByText("Importer CSV")).toBeInTheDocument();
      expect(screen.getByText("Statistiques")).toBeInTheDocument();
      expect(screen.getByText("Ajouter un revenu")).toBeInTheDocument();
    });

    it("should render action descriptions", () => {
      render(<QuickActionsPanel />);

      expect(screen.getByText("Enregistrer une nouvelle dépense")).toBeInTheDocument();
      expect(screen.getByText("Importer des dépenses depuis un fichier")).toBeInTheDocument();
      expect(screen.getByText("Voir les statistiques détaillées")).toBeInTheDocument();
      expect(screen.getByText("Enregistrer un nouveau revenu")).toBeInTheDocument();
    });

    it("should render incentive message", () => {
      render(<QuickActionsPanel />);

      expect(screen.getByText(/Astuce/i)).toBeInTheDocument();
      expect(screen.getByText(/Utilisez les raccourcis clavier pour un accès encore plus rapide/i)).toBeInTheDocument();
    });
  });

  describe("Links and Hrefs", () => {
    it('should have correct href for "Ajouter une dépense"', () => {
      render(<QuickActionsPanel />);

      const addExpenseButton = screen.getByLabelText("Ajouter une nouvelle dépense");

      expect(addExpenseButton).toHaveAttribute("href", "/depenses?action=add");
    });

    it('should have correct href for "Importer CSV"', () => {
      render(<QuickActionsPanel />);

      const importButton = screen.getByLabelText("Importer des dépenses depuis un fichier CSV");

      expect(importButton).toHaveAttribute("href", "/depenses?action=import");
    });

    it('should have correct href for "Statistiques"', () => {
      render(<QuickActionsPanel />);

      const statsButton = screen.getByLabelText("Voir les statistiques financières détaillées");

      expect(statsButton).toHaveAttribute("href", "/statistiques");
    });

    it('should have correct href for "Ajouter un revenu"', () => {
      render(<QuickActionsPanel />);

      const addRevenueButton = screen.getByLabelText("Ajouter un nouveau revenu");

      expect(addRevenueButton).toHaveAttribute("href", "/revenus?action=add");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label for each action", () => {
      render(<QuickActionsPanel />);

      expect(screen.getByLabelText("Ajouter une nouvelle dépense")).toBeInTheDocument();
      expect(screen.getByLabelText("Importer des dépenses depuis un fichier CSV")).toBeInTheDocument();
      expect(screen.getByLabelText("Voir les statistiques financières détaillées")).toBeInTheDocument();
      expect(screen.getByLabelText("Ajouter un nouveau revenu")).toBeInTheDocument();
    });

    it("should have focus styles (focus:ring classes)", () => {
      const { container } = render(<QuickActionsPanel />);

      const links = container.querySelectorAll("a");

      links.forEach((link) => {
        expect(link.className).toContain("focus:outline-none");
        expect(link.className).toContain("focus:ring-2");
      });
    });
  });

  describe("Styling", () => {
    it("should apply correct background colors", () => {
      const { container } = render(<QuickActionsPanel />);

      // Vérifier la présence des classes de couleur
      expect(container.querySelector(".bg-red-500")).toBeInTheDocument(); // Ajouter dépense
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument(); // Importer CSV
      expect(container.querySelector(".bg-indigo-500")).toBeInTheDocument(); // Statistiques
      expect(container.querySelector(".bg-green-500")).toBeInTheDocument(); // Ajouter revenu
    });

    it("should have hover effects classes", () => {
      const { container } = render(<QuickActionsPanel />);

      const links = container.querySelectorAll("a");

      links.forEach((link) => {
        expect(link.className).toContain("hover:scale-105");
        expect(link.className).toContain("hover:shadow-md");
      });
    });

    it("should have transition and transform classes", () => {
      const { container } = render(<QuickActionsPanel />);

      const links = container.querySelectorAll("a");

      links.forEach((link) => {
        expect(link.className).toContain("transition-all");
        expect(link.className).toContain("transform");
      });
    });
  });

  describe("Icons", () => {
    it("should render SVG icons for each action", () => {
      const { container } = render(<QuickActionsPanel />);

      // Chaque action doit avoir une icône SVG
      const svgElements = container.querySelectorAll("svg");

      // 4 actions = 4 icônes SVG
      expect(svgElements.length).toBe(4);
    });
  });

  describe("Responsive Grid", () => {
    it("should have responsive grid classes", () => {
      const { container } = render(<QuickActionsPanel />);

      const grid = container.querySelector(".grid");

      expect(grid?.className).toContain("grid-cols-1"); // Mobile
      expect(grid?.className).toContain("sm:grid-cols-2"); // Tablet
      expect(grid?.className).toContain("lg:grid-cols-4"); // Desktop
    });
  });

  describe("Action IDs", () => {
    it("should render actions with unique identifiers", () => {
      render(<QuickActionsPanel />);

      // Vérifier que les 4 actions sont présentes avec leurs labels uniques
      const actions = ["Ajouter une dépense", "Importer CSV", "Statistiques", "Ajouter un revenu"];

      actions.forEach((actionLabel) => {
        expect(screen.getByText(actionLabel)).toBeInTheDocument();
      });
    });
  });

  describe("Panel Structure", () => {
    it("should have correct panel structure with header and grid", () => {
      const { container } = render(<QuickActionsPanel />);

      // Panel principal
      const panel = container.querySelector(".bg-white.rounded-lg.shadow-md");
      expect(panel).toBeInTheDocument();

      // Grille d'actions
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();

      // Zone message incitatif
      const incentiveBox = container.querySelector(".bg-gray-50");
      expect(incentiveBox).toBeInTheDocument();
    });
  });

  describe("Text Colors", () => {
    it("should apply white text color to all action buttons", () => {
      const { container } = render(<QuickActionsPanel />);

      const links = container.querySelectorAll("a");

      links.forEach((link) => {
        expect(link.className).toContain("text-white");
      });
    });
  });
});
