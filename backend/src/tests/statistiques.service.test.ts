import mongoose from "mongoose";
import { StatistiquesService } from "../services/statistiques.service";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import User from "../models/user.model";
import Categorie from "../models/categorie.model";
import CategorieRevenu from "../models/categorieRevenu.model";

describe("StatistiquesService", () => {
  let testUserId: mongoose.Types.ObjectId;
  let testPartnerId: mongoose.Types.ObjectId;
  let testCategorieId: mongoose.Types.ObjectId;
  let testCategorieRevenuId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const testUser = await User.create({
      nom: "Test User",
      email: "test@example.com",
      motDePasse: "password123",
      role: "Perso",
    });
    testUserId = testUser._id as mongoose.Types.ObjectId;

    const testPartner = await User.create({
      nom: "Test Partner",
      email: "partner@example.com",
      motDePasse: "password123",
      role: "Conjoint",
    });
    testPartnerId = testPartner._id as mongoose.Types.ObjectId;

    const testCategorie = await Categorie.create({
      nom: "Test Categorie",
      description: "Test description",
    });
    testCategorieId = testCategorie._id as mongoose.Types.ObjectId;

    const testCategorieRevenu = await CategorieRevenu.create({
      nom: "Test Categorie Revenu",
      description: "Test description",
      utilisateur: testUserId,
    });
    testCategorieRevenuId = testCategorieRevenu._id as mongoose.Types.ObjectId;
  });

  describe("getTotalFluxMensuel", () => {
    it("should calculate total monthly expenses correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense 1",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense 2",
      });

      const total = await StatistiquesService.getTotalFluxMensuel(
        testUserId,
        startDate,
        endDate,
        "depense",
        DepenseModel
      );

      expect(total).toBe(300);
    });

    it("should calculate total monthly revenues correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await RevenuModel.create({
        montant: 1500,
        date: new Date("2024-01-15"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Test revenue 1",
        typeCompte: "Perso",
      });

      await RevenuModel.create({
        montant: 500,
        date: new Date("2024-01-20"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Test revenue 2",
        typeCompte: "Perso",
      });

      const total = await StatistiquesService.getTotalFluxMensuel(
        testUserId,
        startDate,
        endDate,
        "revenu",
        RevenuModel
      );

      expect(total).toBe(2000);
    });

    it("should return 0 when no transactions in period", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const total = await StatistiquesService.getTotalFluxMensuel(
        testUserId,
        startDate,
        endDate,
        "depense",
        DepenseModel
      );

      expect(total).toBe(0);
    });

    it("should filter by additional match criteria", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense",
        estChargeFixe: true,
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense",
        estChargeFixe: false,
      });

      const totalWithFilter = await StatistiquesService.getTotalFluxMensuel(
        testUserId,
        startDate,
        endDate,
        "depense",
        DepenseModel,
        { estChargeFixe: true }
      );

      expect(totalWithFilter).toBe(100);
    });

    it("should handle multiple users correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "User 1 expense",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testPartnerId,
        description: "User 2 expense",
      });

      const total = await StatistiquesService.getTotalFluxMensuel(
        { $in: [testUserId, testPartnerId] },
        startDate,
        endDate,
        "depense",
        DepenseModel
      );

      expect(total).toBe(300);
    });
  });

  describe("getSoldePourPeriode", () => {
    it("should calculate balance correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await RevenuModel.create({
        montant: 2000,
        date: new Date("2024-01-15"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Test revenue",
        typeCompte: "Perso",
      });

      await DepenseModel.create({
        montant: 800,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense",
      });

      const solde = await StatistiquesService.getSoldePourPeriode(
        testUserId,
        startDate,
        endDate
      );

      expect(solde).toEqual({
        totalRevenus: 2000,
        totalDepenses: 800,
        solde: 1200,
      });
    });

    it("should handle negative balance", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await RevenuModel.create({
        montant: 1000,
        date: new Date("2024-01-15"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Test revenue",
        typeCompte: "Perso",
      });

      await DepenseModel.create({
        montant: 1500,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Test expense",
      });

      const solde = await StatistiquesService.getSoldePourPeriode(
        testUserId,
        startDate,
        endDate
      );

      expect(solde).toEqual({
        totalRevenus: 1000,
        totalDepenses: 1500,
        solde: -500,
      });
    });

    it("should return zero values when no transactions", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const solde = await StatistiquesService.getSoldePourPeriode(
        testUserId,
        startDate,
        endDate
      );

      expect(solde).toEqual({
        totalRevenus: 0,
        totalDepenses: 0,
        solde: 0,
      });
    });
  });

  describe("getCategoriesEnHausse", () => {
    it("should identify categories with significant increases", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Previous month expense",
      });

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          20,
          50
        );

      expect(categoriesEnHausse).toHaveLength(1);
      expect(categoriesEnHausse[0]).toEqual({
        categorieId: testCategorieId.toString(),
        nom: "Test Categorie",
        totalMoisActuel: 300,
        totalMoisPrecedent: 100,
        variationPourcent: 200,
        variationValeur: 200,
      });
    });

    it("should filter out categories below threshold", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Previous month expense",
      });

      await DepenseModel.create({
        montant: 105,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          20,
          10
        );

      expect(categoriesEnHausse).toHaveLength(0);
    });

    it("should handle categories with no previous month data", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          50,
          100
        );

      expect(categoriesEnHausse).toHaveLength(1);
      expect(categoriesEnHausse[0]).toEqual({
        categorieId: testCategorieId.toString(),
        nom: "Test Categorie",
        totalMoisActuel: 300,
        totalMoisPrecedent: 0,
        variationPourcent: 100,
        variationValeur: 300,
      });
    });

    it("should exclude categories with decreasing amounts", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Previous month expense",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          20,
          10
        );

      expect(categoriesEnHausse).toHaveLength(0);
    });

    it("should handle zero spending in previous month correctly", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 150,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          50,
          100
        );

      expect(categoriesEnHausse).toHaveLength(1);
      expect(categoriesEnHausse[0]).toEqual({
        categorieId: testCategorieId.toString(),
        nom: "Test Categorie",
        totalMoisActuel: 150,
        totalMoisPrecedent: 0,
        variationPourcent: 100,
        variationValeur: 150,
      });
    });

    it("should filter out high percentage increases with low absolute value", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      await DepenseModel.create({
        montant: 1,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Previous month small expense",
      });

      await DepenseModel.create({
        montant: 3,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month small expense",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          50,
          10
        );

      expect(categoriesEnHausse).toHaveLength(0);
    });

    it("should return empty array when no transactions exist for any period", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          20,
          10
        );

      expect(categoriesEnHausse).toHaveLength(0);
      expect(Array.isArray(categoriesEnHausse)).toBe(true);
    });

    it("should sort categories by variation percentage descending", async () => {
      const currentStart = new Date("2024-02-01");
      const currentEnd = new Date("2024-02-29");

      const categorie2 = await Categorie.create({
        nom: "Test Categorie 2",
        description: "Test description 2",
      });

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Previous month expense cat 1",
      });

      await DepenseModel.create({
        montant: 500,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Current month expense cat 1",
      });

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-15"),
        categorie: categorie2._id,
        utilisateur: testUserId,
        description: "Previous month expense cat 2",
      });

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-02-15"),
        categorie: categorie2._id,
        utilisateur: testUserId,
        description: "Current month expense cat 2",
      });

      const categoriesEnHausse =
        await StatistiquesService.getCategoriesEnHausse(
          testUserId,
          currentStart,
          currentEnd,
          20,
          50
        );

      expect(categoriesEnHausse).toHaveLength(2);
      expect(categoriesEnHausse[0].variationPourcent).toBeGreaterThan(
        categoriesEnHausse[1].variationPourcent
      );
      expect(categoriesEnHausse[0].variationPourcent).toBe(400);
      expect(categoriesEnHausse[1].variationPourcent).toBe(200);
    });
  });

  describe("getRepartitionParCategorie", () => {
    it("should calculate expense distribution by category", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const categorie2 = await Categorie.create({
        nom: "Test Categorie 2",
        description: "Test description 2",
      });

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Expense 1",
      });

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Expense 2",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-25"),
        categorie: categorie2._id,
        utilisateur: testUserId,
        description: "Expense 3",
      });

      const repartition = await StatistiquesService.getRepartitionParCategorie(
        testUserId,
        startDate,
        endDate,
        "depense"
      );

      expect(repartition).toHaveLength(2);
      expect(repartition[0]).toEqual({
        _id: testCategorieId,
        total: 400,
        count: 2,
        nom: "Test Categorie",
      });
      expect(repartition[1]).toEqual({
        _id: categorie2._id,
        total: 200,
        count: 1,
        nom: "Test Categorie 2",
      });
    });

    it("should calculate revenue distribution by category", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const categorieRevenu2 = await CategorieRevenu.create({
        nom: "Test Categorie Revenu 2",
        description: "Test description 2",
        utilisateur: testUserId,
      });

      await RevenuModel.create({
        montant: 2000,
        date: new Date("2024-01-15"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Revenue 1",
        typeCompte: "Perso",
      });

      await RevenuModel.create({
        montant: 1000,
        date: new Date("2024-01-20"),
        categorieRevenu: categorieRevenu2._id,
        utilisateur: testUserId,
        description: "Revenue 2",
        typeCompte: "Perso",
      });

      const repartition = await StatistiquesService.getRepartitionParCategorie(
        testUserId,
        startDate,
        endDate,
        "revenu"
      );

      expect(repartition).toHaveLength(2);
      expect(repartition[0]).toEqual({
        _id: testCategorieRevenuId,
        total: 2000,
        count: 1,
        nom: "Test Categorie Revenu",
      });
      expect(repartition[1]).toEqual({
        _id: categorieRevenu2._id,
        total: 1000,
        count: 1,
        nom: "Test Categorie Revenu 2",
      });
    });

    it("should return empty array when no transactions", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const repartition = await StatistiquesService.getRepartitionParCategorie(
        testUserId,
        startDate,
        endDate,
        "depense"
      );

      expect(repartition).toHaveLength(0);
    });

    it("should handle multiple users correctly", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-01-15"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "User 1 expense",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-20"),
        categorie: testCategorieId,
        utilisateur: testPartnerId,
        description: "User 2 expense",
      });

      const repartition = await StatistiquesService.getRepartitionParCategorie(
        { $in: [testUserId, testPartnerId] },
        startDate,
        endDate,
        "depense"
      );

      expect(repartition).toHaveLength(1);
      expect(repartition[0]).toEqual({
        _id: testCategorieId,
        total: 500,
        count: 2,
        nom: "Test Categorie",
      });
    });
  });

  describe("Edge Cases - Empty/Zero Data", () => {
    describe("getSoldePourPeriode with empty data", () => {
      it("should return zero values when no transactions exist", async () => {
        const startDate = new Date("2024-01-01");
        const endDate = new Date("2024-01-31");

        const solde = await StatistiquesService.getSoldePourPeriode(
          testUserId,
          startDate,
          endDate
        );

        expect(solde).toEqual({
          totalRevenus: 0,
          totalDepenses: 0,
          solde: 0,
        });
      });

      it("should handle period with only revenues (no expenses)", async () => {
        const startDate = new Date("2024-01-01");
        const endDate = new Date("2024-01-31");

        await RevenuModel.create({
          montant: 1500,
          date: new Date("2024-01-15"),
          categorieRevenu: testCategorieRevenuId,
          utilisateur: testUserId,
          description: "Test revenue",
          typeCompte: "Perso",
        });

        const solde = await StatistiquesService.getSoldePourPeriode(
          testUserId,
          startDate,
          endDate
        );

        expect(solde).toEqual({
          totalRevenus: 1500,
          totalDepenses: 0,
          solde: 1500,
        });
      });

      it("should handle period with only expenses (no revenues)", async () => {
        const startDate = new Date("2024-01-01");
        const endDate = new Date("2024-01-31");

        await DepenseModel.create({
          montant: 800,
          date: new Date("2024-01-15"),
          categorie: testCategorieId,
          utilisateur: testUserId,
          description: "Test expense",
        });

        const solde = await StatistiquesService.getSoldePourPeriode(
          testUserId,
          startDate,
          endDate
        );

        expect(solde).toEqual({
          totalRevenus: 0,
          totalDepenses: 800,
          solde: -800,
        });
      });
    });

    describe("getRepartitionParCategorie with empty data", () => {
      it("should return empty array when no expenses exist", async () => {
        const startDate = new Date("2024-01-01");
        const endDate = new Date("2024-01-31");

        const repartition =
          await StatistiquesService.getRepartitionParCategorie(
            testUserId,
            startDate,
            endDate,
            "depense"
          );

        expect(Array.isArray(repartition)).toBe(true);
        expect(repartition).toHaveLength(0);
      });

      it("should return empty array when no revenues exist", async () => {
        const startDate = new Date("2024-01-01");
        const endDate = new Date("2024-01-31");

        const repartition =
          await StatistiquesService.getRepartitionParCategorie(
            testUserId,
            startDate,
            endDate,
            "revenu"
          );

        expect(Array.isArray(repartition)).toBe(true);
        expect(repartition).toHaveLength(0);
      });

      it("should handle transactions outside the period gracefully", async () => {
        const startDate = new Date("2024-06-01");
        const endDate = new Date("2024-06-30");

        await DepenseModel.create({
          montant: 100,
          date: new Date("2024-01-15"),
          categorie: testCategorieId,
          utilisateur: testUserId,
          description: "Old expense",
        });

        await DepenseModel.create({
          montant: 200,
          date: new Date("2024-12-15"),
          categorie: testCategorieId,
          utilisateur: testUserId,
          description: "Future expense",
        });

        const repartition =
          await StatistiquesService.getRepartitionParCategorie(
            testUserId,
            startDate,
            endDate,
            "depense"
          );

        expect(Array.isArray(repartition)).toBe(true);
        expect(repartition).toHaveLength(0);
      });
    });

    describe("getCategoriesEnHausse with empty data", () => {
      it("should return empty array gracefully when no data exists", async () => {
        const currentStart = new Date("2024-02-01");
        const currentEnd = new Date("2024-02-29");

        const categoriesEnHausse =
          await StatistiquesService.getCategoriesEnHausse(
            testUserId,
            currentStart,
            currentEnd,
            20,
            10
          );

        expect(Array.isArray(categoriesEnHausse)).toBe(true);
        expect(categoriesEnHausse).toHaveLength(0);
      });

      it("should handle user with no transactions gracefully", async () => {
        const currentStart = new Date("2024-02-01");
        const currentEnd = new Date("2024-02-29");

        const otherUser = await User.create({
          nom: "Other User",
          email: "other@example.com",
          motDePasse: "password123",
          role: "Perso",
        });

        await DepenseModel.create({
          montant: 100,
          date: new Date("2024-02-15"),
          categorie: testCategorieId,
          utilisateur: otherUser._id,
          description: "Other user expense",
        });

        const categoriesEnHausse =
          await StatistiquesService.getCategoriesEnHausse(
            testUserId,
            currentStart,
            currentEnd,
            20,
            10
          );

        expect(Array.isArray(categoriesEnHausse)).toBe(true);
        expect(categoriesEnHausse).toHaveLength(0);
      });
    });
  });

  describe("getUpcomingCharges", () => {
    it("should identify paid fixed charges for current month", async () => {
      const currentDate = new Date("2024-02-15");

      // Créer des charges fixes payées ce mois
      await DepenseModel.create({
        montant: 800,
        date: new Date("2024-02-05"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Loyer",
        estChargeFixe: true,
      });

      await DepenseModel.create({
        montant: 50,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Internet",
        estChargeFixe: true,
      });

      const result = await StatistiquesService.getUpcomingCharges(testUserId, currentDate);

      expect(result.paid).toHaveLength(2);
      expect(result.totalPaid).toBe(850);
      expect(result.upcoming).toHaveLength(0);
      expect(result.totalUpcoming).toBe(0);
    });

    it("should identify upcoming fixed charges not yet paid", async () => {
      const currentDate = new Date("2024-02-15");

      // Charges du mois précédent
      await DepenseModel.create({
        montant: 800,
        date: new Date("2024-01-05"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Loyer",
        estChargeFixe: true,
      });

      await DepenseModel.create({
        montant: 50,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Internet",
        estChargeFixe: true,
      });

      // Une seule charge payée ce mois
      await DepenseModel.create({
        montant: 800,
        date: new Date("2024-02-05"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Loyer",
        estChargeFixe: true,
      });

      const result = await StatistiquesService.getUpcomingCharges(testUserId, currentDate);

      expect(result.paid).toHaveLength(1);
      expect(result.totalPaid).toBe(800);
      expect(result.upcoming).toHaveLength(1);
      expect(result.upcoming[0].description).toBe("Internet");
      expect(result.upcoming[0].montant).toBe(50);
      expect(result.totalUpcoming).toBe(50);
    });

    it("should work for couple context with multiple users", async () => {
      const currentDate = new Date("2024-02-15");

      // Charges du mois précédent pour les deux utilisateurs
      await DepenseModel.create({
        montant: 800,
        date: new Date("2024-01-05"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Loyer",
        estChargeFixe: true,
      });

      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testPartnerId,
        description: "Électricité",
        estChargeFixe: true,
      });

      // Aucune charge payée ce mois
      const userIds = { $in: [testUserId, testPartnerId] };
      const result = await StatistiquesService.getUpcomingCharges(userIds, currentDate);

      expect(result.paid).toHaveLength(0);
      expect(result.totalPaid).toBe(0);
      expect(result.upcoming).toHaveLength(2);
      expect(result.totalUpcoming).toBe(900);
    });

    it("should handle months with no previous charges", async () => {
      const currentDate = new Date("2024-02-15");

      const result = await StatistiquesService.getUpcomingCharges(testUserId, currentDate);

      expect(result.paid).toHaveLength(0);
      expect(result.totalPaid).toBe(0);
      expect(result.upcoming).toHaveLength(0);
      expect(result.totalUpcoming).toBe(0);
    });
  });

  describe("getLastSync", () => {
    it("should return last expense and revenue dates", async () => {
      // Créer une dépense récente
      await DepenseModel.create({
        montant: 50,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Recent expense",
      });

      // Créer un revenu plus ancien
      await RevenuModel.create({
        montant: 1000,
        date: new Date("2024-02-01"),
        categorieRevenu: testCategorieRevenuId,
        utilisateur: testUserId,
        description: "Salary",
        typeCompte: "Perso",
      });

      const result = await StatistiquesService.getLastSync(testUserId);

      expect(result.lastExpenseDate).toBeInstanceOf(Date);
      expect(result.lastRevenueDate).toBeInstanceOf(Date);
      expect(result.lastActivityDate).toEqual(result.lastExpenseDate); // La dépense est plus récente
      expect(result.daysSinceLastExpense).toBeGreaterThanOrEqual(0);
      expect(result.daysSinceLastRevenue).toBeGreaterThanOrEqual(0);
      expect(result.daysSinceLastActivity).toBeGreaterThanOrEqual(0);
    });

    it("should set needsUpdate to true if more than 7 days without activity", async () => {
      // Créer une dépense de plus de 7 jours
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      await DepenseModel.create({
        montant: 50,
        date: oldDate,
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Old expense",
      });

      const result = await StatistiquesService.getLastSync(testUserId);

      expect(result.daysSinceLastActivity).toBeGreaterThan(7);
      expect(result.needsUpdate).toBe(true);
    });

    it("should set needsUpdate to false if activity within 7 days", async () => {
      // Créer une dépense récente (2 jours)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2);

      await DepenseModel.create({
        montant: 50,
        date: recentDate,
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Recent expense",
      });

      const result = await StatistiquesService.getLastSync(testUserId);

      expect(result.daysSinceLastActivity).toBeLessThanOrEqual(7);
      expect(result.needsUpdate).toBe(false);
    });

    it("should handle no transactions gracefully", async () => {
      const result = await StatistiquesService.getLastSync(testUserId);

      expect(result.lastExpenseDate).toBeNull();
      expect(result.lastRevenueDate).toBeNull();
      expect(result.lastActivityDate).toBeNull();
      expect(result.daysSinceLastExpense).toBeNull();
      expect(result.daysSinceLastRevenue).toBeNull();
      expect(result.daysSinceLastActivity).toBeNull();
      expect(result.needsUpdate).toBe(false);
    });

    it("should work for couple context with multiple users", async () => {
      // Dépense de l'utilisateur principal (ancienne)
      await DepenseModel.create({
        montant: 50,
        date: new Date("2024-02-01"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "User expense",
      });

      // Dépense du partenaire (plus récente)
      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-02-15"),
        categorie: testCategorieId,
        utilisateur: testPartnerId,
        description: "Partner expense",
      });

      const userIds = { $in: [testUserId, testPartnerId] };
      const result = await StatistiquesService.getLastSync(userIds);

      // Doit retourner la date de la dépense du partenaire (la plus récente)
      expect(result.lastActivityDate).toBeInstanceOf(Date);
      expect(new Date(result.lastActivityDate!).getDate()).toBe(15);
    });
  });

  describe("getExpensesTrends", () => {
    it("should return top categories with trends", async () => {
      const testCategorie2Id = (
        await Categorie.create({
          nom: "Alimentation",
          description: "Courses alimentaires",
        })
      )._id as mongoose.Types.ObjectId;

      // Mois actuel (février 2024)
      const currentDate = new Date("2024-02-15");

      // Dépenses mois actuel (février)
      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-02-10"),
        categorie: testCategorieId, // Test Categorie
        utilisateur: testUserId,
        description: "Dépense catégorie 1",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-02-12"),
        categorie: testCategorie2Id, // Alimentation
        utilisateur: testUserId,
        description: "Courses",
      });

      // Dépenses mois précédent (janvier)
      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense catégorie 1 mois précédent",
      });

      await DepenseModel.create({
        montant: 250,
        date: new Date("2024-01-12"),
        categorie: testCategorie2Id,
        utilisateur: testUserId,
        description: "Courses mois précédent",
      });

      const result = await StatistiquesService.getExpensesTrends(
        testUserId,
        3,
        currentDate
      );

      expect(result).toBeDefined();
      expect(result.topCategories).toBeDefined();
      expect(result.topCategories.length).toBeGreaterThan(0);
      expect(result.evolutionMensuelle).toBeDefined();
      expect(result.evolutionMensuelle.length).toBe(3);

      // Vérifier la structure des top catégories
      const topCat = result.topCategories[0];
      expect(topCat).toHaveProperty("categorieId");
      expect(topCat).toHaveProperty("nom");
      expect(topCat).toHaveProperty("totalActuel");
      expect(topCat).toHaveProperty("totalPrecedent");
      expect(topCat).toHaveProperty("variation");
      expect(topCat).toHaveProperty("variationPourcent");
      expect(topCat).toHaveProperty("tendance");
      expect(["hausse", "baisse", "stable"]).toContain(topCat.tendance);
    });

    it("should calculate trends correctly (hausse)", async () => {
      const currentDate = new Date("2024-02-15");

      // Mois actuel: 500€
      await DepenseModel.create({
        montant: 500,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense actuelle",
      });

      // Mois précédent: 300€
      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense précédente",
      });

      const result = await StatistiquesService.getExpensesTrends(
        testUserId,
        2,
        currentDate
      );

      const topCat = result.topCategories[0];
      expect(topCat.totalActuel).toBe(500);
      expect(topCat.totalPrecedent).toBe(300);
      expect(topCat.variation).toBe(200);
      expect(topCat.tendance).toBe("hausse");
      expect(topCat.variationPourcent).toBeCloseTo(66.67, 1);
    });

    it("should calculate trends correctly (baisse)", async () => {
      const currentDate = new Date("2024-02-15");

      // Mois actuel: 200€
      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense actuelle",
      });

      // Mois précédent: 400€
      await DepenseModel.create({
        montant: 400,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense précédente",
      });

      const result = await StatistiquesService.getExpensesTrends(
        testUserId,
        2,
        currentDate
      );

      const topCat = result.topCategories[0];
      expect(topCat.totalActuel).toBe(200);
      expect(topCat.totalPrecedent).toBe(400);
      expect(topCat.variation).toBe(-200);
      expect(topCat.tendance).toBe("baisse");
      expect(topCat.variationPourcent).toBe(-50);
    });

    it("should work for couple context", async () => {
      const currentDate = new Date("2024-02-15");

      // Dépenses utilisateur
      await DepenseModel.create({
        montant: 300,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Dépense user",
      });

      // Dépenses partenaire
      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-02-12"),
        categorie: testCategorieId,
        utilisateur: testPartnerId,
        description: "Dépense partner",
      });

      const userIds = { $in: [testUserId, testPartnerId] };
      const result = await StatistiquesService.getExpensesTrends(
        userIds,
        3,
        currentDate
      );

      expect(result.topCategories.length).toBeGreaterThan(0);
      // Total devrait être 500 (300 + 200)
      expect(result.topCategories[0].totalActuel).toBe(500);
    });

    it("should return evolution mensuelle with correct structure", async () => {
      const currentDate = new Date("2024-03-15");

      // Créer des dépenses sur 3 mois
      await DepenseModel.create({
        montant: 100,
        date: new Date("2024-01-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Janvier",
      });

      await DepenseModel.create({
        montant: 150,
        date: new Date("2024-02-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Février",
      });

      await DepenseModel.create({
        montant: 200,
        date: new Date("2024-03-10"),
        categorie: testCategorieId,
        utilisateur: testUserId,
        description: "Mars",
      });

      const result = await StatistiquesService.getExpensesTrends(
        testUserId,
        3,
        currentDate
      );

      expect(result.evolutionMensuelle.length).toBe(3);
      
      // Vérifier la structure de chaque mois
      result.evolutionMensuelle.forEach((mois) => {
        expect(mois).toHaveProperty("mois");
        expect(mois).toHaveProperty("annee");
        expect(mois).toHaveProperty("categories");
        expect(Array.isArray(mois.categories)).toBe(true);
        
        if (mois.categories.length > 0) {
          expect(mois.categories[0]).toHaveProperty("categorieId");
          expect(mois.categories[0]).toHaveProperty("nom");
          expect(mois.categories[0]).toHaveProperty("total");
        }
      });
    });
  });
});

