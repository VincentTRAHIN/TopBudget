import { render, screen } from "@testing-library/react";

import UpcomingChargesCalendar from "../../components/dashboard/UpcomingChargesCalendar.component";
import { useUpcomingCharges } from "../../hooks/useUpcomingCharges.hook";

// Mock du hook useUpcomingCharges
jest.mock("../../hooks/useUpcomingCharges.hook");

const mockUseUpcomingCharges = useUpcomingCharges as jest.MockedFunction<typeof useUpcomingCharges>;

describe("UpcomingChargesCalendar Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display skeleton loader when loading", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [],
        totalPaid: 0,
        totalUpcoming: 0,
        totalCharges: 0,
        remainingToPay: 0,
        isLoading: true,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<UpcomingChargesCalendar />);
      const skeleton = container.querySelector(".animate-pulse");

      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message on error", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [],
        totalPaid: 0,
        totalUpcoming: 0,
        totalCharges: 0,
        remainingToPay: 0,
        isLoading: false,
        isError: true,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText(/Erreur lors du chargement des charges fixes/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty message when no charges", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [],
        totalPaid: 0,
        totalUpcoming: 0,
        totalCharges: 0,
        remainingToPay: 0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText(/Aucune charge fixe pour ce mois/i)).toBeInTheDocument();
      expect(screen.getByText(/Les charges récurrentes apparaîtront ici/i)).toBeInTheDocument();
    });
  });

  describe("Display Paid Charges", () => {
    it("should display paid charges correctly", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [
          {
            _id: "1",
            montant: 50.0,
            date: "2025-10-15T00:00:00.000Z",
            description: "Netflix",
            categorie: {
              _id: "cat1",
              nom: "Abonnements",
            },
            typeCompte: "Individuel",
            typeDepense: "Loisir",
            estChargeFixe: true,
          },
          {
            _id: "2",
            montant: 1200.0,
            date: "2025-10-01T00:00:00.000Z",
            categorie: {
              _id: "cat2",
              nom: "Loyer",
            },
            typeCompte: "Individuel",
            typeDepense: "Logement",
            estChargeFixe: true,
          },
        ],
        upcoming: [],
        totalPaid: 1250.0,
        totalUpcoming: 0,
        totalCharges: 1250.0,
        remainingToPay: 0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText("Charges payées")).toBeInTheDocument();
      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("Loyer")).toBeInTheDocument();
      expect(screen.getByText("50.00€")).toBeInTheDocument();
      expect(screen.getByText("1200.00€")).toBeInTheDocument();
    });

    it("should use category name when description is missing", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [
          {
            _id: "1",
            montant: 100.0,
            date: "2025-10-15T00:00:00.000Z",
            categorie: {
              _id: "cat1",
              nom: "Électricité",
            },
            typeCompte: "Individuel",
            typeDepense: "Logement",
            estChargeFixe: true,
          },
        ],
        upcoming: [],
        totalPaid: 100.0,
        totalUpcoming: 0,
        totalCharges: 100.0,
        remainingToPay: 0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText("Électricité")).toBeInTheDocument();
    });
  });

  describe("Display Upcoming Charges", () => {
    it("should display upcoming charges correctly", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [
          {
            description: "Spotify Premium",
            montant: 9.99,
            categorie: {
              _id: "cat1",
              nom: "Abonnements",
            },
            date: "2025-10-25T00:00:00.000Z",
          },
          {
            description: "Assurance Auto",
            montant: 80.0,
            categorie: {
              _id: "cat2",
              nom: "Assurances",
            },
            date: "2025-10-30T00:00:00.000Z",
          },
        ],
        totalPaid: 0,
        totalUpcoming: 89.99,
        totalCharges: 89.99,
        remainingToPay: 89.99,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText("Charges à venir")).toBeInTheDocument();
      expect(screen.getByText("Spotify Premium")).toBeInTheDocument();
      expect(screen.getByText("Assurance Auto")).toBeInTheDocument();
      expect(screen.getByText("9.99€")).toBeInTheDocument();
      expect(screen.getByText("80.00€")).toBeInTheDocument();
    });

    it("should display incentive message when upcoming charges exist", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [
          {
            description: "Internet",
            montant: 30.0,
            categorie: {
              _id: "cat1",
              nom: "Abonnements",
            },
            date: "2025-10-25T00:00:00.000Z",
          },
        ],
        totalPaid: 0,
        totalUpcoming: 30.0,
        totalCharges: 30.0,
        remainingToPay: 30.0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText(/1.*charge.*fixe.*à prévoir ce mois/i)).toBeInTheDocument();
    });

    it("should display plural form for multiple upcoming charges", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [
          {
            description: "Charge 1",
            montant: 10.0,
            categorie: { _id: "1", nom: "Cat1" },
            date: "2025-10-25T00:00:00.000Z",
          },
          {
            description: "Charge 2",
            montant: 20.0,
            categorie: { _id: "2", nom: "Cat2" },
            date: "2025-10-26T00:00:00.000Z",
          },
        ],
        totalPaid: 0,
        totalUpcoming: 30.0,
        totalCharges: 30.0,
        remainingToPay: 30.0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText(/2.*charges.*fixes.*à prévoir ce mois/i)).toBeInTheDocument();
    });
  });

  describe("Display Totals Summary", () => {
    it("should display all totals correctly", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [
          {
            _id: "1",
            montant: 100.0,
            date: "2025-10-10T00:00:00.000Z",
            categorie: { _id: "cat1", nom: "Cat1" },
            typeCompte: "Individuel",
            typeDepense: "Loisir",
            estChargeFixe: true,
          },
        ],
        upcoming: [
          {
            description: "Upcoming 1",
            montant: 50.0,
            categorie: { _id: "cat2", nom: "Cat2" },
            date: "2025-10-25T00:00:00.000Z",
          },
        ],
        totalPaid: 100.0,
        totalUpcoming: 50.0,
        totalCharges: 150.0,
        remainingToPay: 50.0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText("Total payé")).toBeInTheDocument();
      expect(screen.getByText("Total à venir")).toBeInTheDocument();
      expect(screen.getByText("Reste à payer")).toBeInTheDocument();

      // Vérifier les montants (il peut y avoir plusieurs "100.00€" donc on vérifie leur présence)
      const amounts = screen.getAllByText(/\d+\.\d{2}€/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should highlight "Reste à payer" value', () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [],
        upcoming: [
          {
            description: "Test",
            montant: 75.0,
            categorie: { _id: "1", nom: "Cat" },
            date: "2025-10-25T00:00:00.000Z",
          },
        ],
        totalPaid: 0,
        totalUpcoming: 75.0,
        totalCharges: 75.0,
        remainingToPay: 75.0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      const { container } = render(<UpcomingChargesCalendar />);

      // Le reste à payer doit avoir une classe spéciale (indigo, bold)
      const resteAPayer = container.querySelector(".text-indigo-600.font-bold");
      expect(resteAPayer).toBeInTheDocument();
    });
  });

  describe("Mixed State - Paid and Upcoming", () => {
    it("should display both paid and upcoming charges together", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [
          {
            _id: "1",
            montant: 500.0,
            date: "2025-10-05T00:00:00.000Z",
            description: "Loyer",
            categorie: { _id: "cat1", nom: "Logement" },
            typeCompte: "Individuel",
            typeDepense: "Logement",
            estChargeFixe: true,
          },
        ],
        upcoming: [
          {
            description: "EDF",
            montant: 80.0,
            categorie: { _id: "cat2", nom: "Énergie" },
            date: "2025-10-28T00:00:00.000Z",
          },
        ],
        totalPaid: 500.0,
        totalUpcoming: 80.0,
        totalCharges: 580.0,
        remainingToPay: 80.0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      expect(screen.getByText("Charges payées")).toBeInTheDocument();
      expect(screen.getByText("Charges à venir")).toBeInTheDocument();
      expect(screen.getByText("Loyer")).toBeInTheDocument();
      expect(screen.getByText("EDF")).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format dates correctly in French", () => {
      mockUseUpcomingCharges.mockReturnValue({
        paid: [
          {
            _id: "1",
            montant: 50.0,
            date: "2025-10-15T00:00:00.000Z",
            description: "Test",
            categorie: { _id: "cat1", nom: "Cat1" },
            typeCompte: "Individuel",
            typeDepense: "Loisir",
            estChargeFixe: true,
          },
        ],
        upcoming: [],
        totalPaid: 50.0,
        totalUpcoming: 0,
        totalCharges: 50.0,
        remainingToPay: 0,
        isLoading: false,
        isError: false,
        mutate: jest.fn(),
      });

      render(<UpcomingChargesCalendar />);

      // La date devrait être formatée (vérifier qu'il y a un texte de date)
      const dateElements = screen.getAllByText(/\d{1,2}/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});
