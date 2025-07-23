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
});
