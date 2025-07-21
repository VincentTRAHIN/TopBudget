import mongoose from "mongoose";
import { StatistiquesService } from "../services/statistiques.service";
import User from "../models/user.model";
import Categorie from "../models/categorie.model";
import CategorieRevenu from "../models/categorieRevenu.model";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";

describe("StatistiquesService Performance Tests", () => {
  let userId: mongoose.Types.ObjectId;
  let categorieId: mongoose.Types.ObjectId;
  let categorieRevenuId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const user = await User.create({
      nom: "Performance Test User",
      email: "perf@example.com",
      motDePasse: "password123",
      role: "Perso",
    });
    userId = user._id as mongoose.Types.ObjectId;

    const categorie = await Categorie.create({
      nom: "Performance Category",
      description: "Category for performance tests",
      couleur: "#FF0000",
      utilisateur: userId,
    });
    categorieId = categorie._id as mongoose.Types.ObjectId;

    const categorieRevenu = await CategorieRevenu.create({
      nom: "Performance Revenue Category",
      description: "Revenue category for performance tests",
      couleur: "#00FF00",
      utilisateur: userId,
    });
    categorieRevenuId = categorieRevenu._id as mongoose.Types.ObjectId;
  });

  describe("Performance with Large Dataset", () => {
    const createLargeDataset = async (
      expenseCount: number,
      revenueCount: number
    ) => {
      const expenses = [];
      const revenues = [];

      const startDate = new Date("2023-01-01");
      const endDate = new Date("2024-12-31");
      const timeRange = endDate.getTime() - startDate.getTime();

      for (let i = 0; i < expenseCount; i++) {
        const randomDate = new Date(
          startDate.getTime() + Math.random() * timeRange
        );
        expenses.push({
          nom: `Expense ${i}`,
          montant: Math.floor(Math.random() * 1000) + 10,
          date: randomDate,
          description: `Performance test expense ${i}`,
          categorie: categorieId,
          utilisateur: userId,
          typeCompte: "Perso",
          estChargeFixe: i % 3 === 0,
        });
      }

      for (let i = 0; i < revenueCount; i++) {
        const randomDate = new Date(
          startDate.getTime() + Math.random() * timeRange
        );
        revenues.push({
          nom: `Revenue ${i}`,
          montant: Math.floor(Math.random() * 2000) + 100,
          date: randomDate,
          description: `Performance test revenue ${i}`,
          categorieRevenu: categorieRevenuId,
          utilisateur: userId,
          typeCompte: "Perso",
          estRecurrent: i % 2 === 0,
        });
      }

      await DepenseModel.insertMany(expenses);
      await RevenuModel.insertMany(revenues);
    };

    it("should handle 1000 expenses efficiently", async () => {
      const expenseCount = 1000;
      await createLargeDataset(expenseCount, 0);

      const startTime = Date.now();

      const dateDebut = new Date(2023, 11, 1); // December 1, 2023
      const dateFin = new Date(2023, 11, 31); // December 31, 2023
      
      const result = await StatistiquesService.getTotalFluxMensuel(
        userId,
        dateDebut,
        dateFin,
        "depense",
        DepenseModel
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000);
      expect(result).toBeGreaterThan(0);

      console.log(
        `Performance: ${expenseCount} expenses processed in ${executionTime}ms`
      );
    }, 10000);

    it("should handle 5000 total transactions efficiently", async () => {
      await createLargeDataset(2500, 2500);

      const startTime = Date.now();

      const dateDebut = new Date(2023, 11, 1);
      const dateFin = new Date(2023, 11, 31);

      const [expenseTotal, revenueTotal] = await Promise.all([
        StatistiquesService.getTotalFluxMensuel(userId, dateDebut, dateFin, "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, dateDebut, dateFin, "revenu", RevenuModel),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(3000);
      expect(expenseTotal).toBeGreaterThan(0);
      expect(revenueTotal).toBeGreaterThan(0);

      console.log(
        `Performance: 5000 transactions processed in ${executionTime}ms`
      );
    }, 15000);

    it("should efficiently calculate balance for large datasets", async () => {
      const startTime = Date.now();

      const dateDebut = new Date(2023, 11, 1);
      const dateFin = new Date(2023, 11, 31);

      const balance = await StatistiquesService.getSoldePourPeriode(
        userId,
        dateDebut,
        dateFin
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(4000);
      expect(typeof balance.solde).toBe("number");

      console.log(
        `Performance: Balance calculation completed in ${executionTime}ms`
      );
    }, 20000);

    it("should efficiently calculate category distribution", async () => {
      const startTime = Date.now();

      const dateDebut = new Date(2023, 11, 1);
      const dateFin = new Date(2023, 11, 31);

      const [expenseDistribution, revenueDistribution] = await Promise.all([
        StatistiquesService.getRepartitionParCategorie(
          userId,
          dateDebut,
          dateFin,
          "depense"
        ),
        StatistiquesService.getRepartitionParCategorie(
          userId,
          dateDebut,
          dateFin,
          "revenu"
        ),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(Array.isArray(expenseDistribution)).toBe(true);
      expect(Array.isArray(revenueDistribution)).toBe(true);

      console.log(
        `Performance: Category distribution calculated in ${executionTime}ms`
      );
    }, 25000);

    it("should handle multiple year calculations efficiently", async () => {
      const startTime = Date.now();

      const yearlyCalculations = await Promise.all([
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2023, 0, 1), new Date(2023, 0, 31), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2023, 5, 1), new Date(2023, 5, 30), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2023, 11, 1), new Date(2023, 11, 31), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2024, 0, 1), new Date(2024, 0, 31), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2024, 5, 1), new Date(2024, 5, 30), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2024, 11, 1), new Date(2024, 11, 31), "depense", DepenseModel),
      ]);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(6000);
      expect(yearlyCalculations).toHaveLength(6);

      console.log(
        `Performance: Multiple year calculations completed in ${executionTime}ms`
      );
    }, 30000);
  });

  describe("Performance with Complex Queries", () => {
    beforeEach(async () => {
      await createComplexDataset();
    });

    const createComplexDataset = async () => {
      const categories = [];
      const revenueCategories = [];

      for (let i = 0; i < 10; i++) {
        const cat = await Categorie.create({
          nom: `Category ${i}`,
          description: `Test category ${i}`,
          couleur: "#FF0000",
          utilisateur: userId,
        });
        categories.push(cat._id);

        const revCat = await CategorieRevenu.create({
          nom: `Revenue Category ${i}`,
          description: `Test revenue category ${i}`,
          couleur: "#00FF00",
          utilisateur: userId,
        });
        revenueCategories.push(revCat._id);
      }

      const expenses = [];
      const revenues = [];

      for (let i = 0; i < 500; i++) {
        const randomCategoryIndex = Math.floor(
          Math.random() * categories.length
        );
        const randomRevenueCategoryIndex = Math.floor(
          Math.random() * revenueCategories.length
        );

        expenses.push({
          nom: `Complex Expense ${i}`,
          montant: Math.floor(Math.random() * 500) + 50,
          date: new Date(
            2023,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          description: `Complex test expense ${i}`,
          categorie: categories[randomCategoryIndex],
          utilisateur: userId,
          typeCompte: Math.random() > 0.5 ? "Perso" : "Conjoint",
          estChargeFixe: Math.random() > 0.7,
        });

        revenues.push({
          nom: `Complex Revenue ${i}`,
          montant: Math.floor(Math.random() * 1000) + 200,
          date: new Date(
            2023,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          description: `Complex test revenue ${i}`,
          categorieRevenu: revenueCategories[randomRevenueCategoryIndex],
          utilisateur: userId,
          typeCompte: Math.random() > 0.5 ? "Perso" : "Conjoint",
          estRecurrent: Math.random() > 0.6,
        });
      }

      await DepenseModel.insertMany(expenses);
      await RevenuModel.insertMany(revenues);
    };

    it("should efficiently calculate categories with increases", async () => {
      const startTime = Date.now();

      const categoriesIncrease =
        await StatistiquesService.getCategoriesEnHausse(userId, new Date(2023, 11, 1), new Date(2023, 11, 31));

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(3000);
      expect(Array.isArray(categoriesIncrease)).toBe(true);

      console.log(
        `Performance: Categories increase calculation completed in ${executionTime}ms`
      );
    }, 15000);

    it("should handle concurrent requests efficiently", async () => {
      const startTime = Date.now();

      const concurrentRequests = Array(10)
        .fill(null)
        .map(() =>
          Promise.all([
            StatistiquesService.getTotalFluxMensuel(
              userId,
              new Date(2023, 11, 1),
              new Date(2023, 11, 31),
              "depense",
              DepenseModel
            ),
            StatistiquesService.getRepartitionParCategorie(
              userId,
              new Date(2023, 11, 1),
              new Date(2023, 11, 31),
              "depense"
            ),
            StatistiquesService.getSoldePourPeriode(userId, new Date(2023, 11, 1), new Date(2023, 11, 31)),
          ])
        );

      const results = await Promise.all(concurrentRequests);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10000);
      expect(results).toHaveLength(10);

      console.log(
        `Performance: 10 concurrent requests completed in ${executionTime}ms`
      );
    }, 30000);
  });

  describe("Memory Usage Performance", () => {
    const getMemoryUsage = () => {
      return process.memoryUsage();
    };

    it("should not cause memory leaks with large datasets", async () => {
      const initialMemory = getMemoryUsage();

      await createLargeDataset(1000, 1000);

      for (let i = 0; i < 5; i++) {
        await StatistiquesService.getTotalFluxMensuel(
          userId,
          new Date(2023, 11, 1),
          new Date(2023, 11, 31),
          "depense",
          DepenseModel
        );
        await StatistiquesService.getRepartitionParCategorie(
          userId,
          new Date(2023, 11, 1),
          new Date(2023, 11, 31),
          "depense"
        );
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = getMemoryUsage();

      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseInMB = memoryIncrease / 1024 / 1024;

      expect(memoryIncreaseInMB).toBeLessThan(100);

      console.log(`Memory usage increase: ${memoryIncreaseInMB.toFixed(2)}MB`);
    }, 60000);

    const createLargeDataset = async (
      expenseCount: number,
      revenueCount: number
    ) => {
      const expenses = [];
      const revenues = [];

      for (let i = 0; i < expenseCount; i++) {
        expenses.push({
          nom: `Memory Test Expense ${i}`,
          montant: Math.floor(Math.random() * 1000) + 10,
          date: new Date(
            2023,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          description: `Memory test expense ${i}`,
          categorie: categorieId,
          utilisateur: userId,
          typeCompte: "Perso",
          estChargeFixe: false,
        });
      }

      for (let i = 0; i < revenueCount; i++) {
        revenues.push({
          nom: `Memory Test Revenue ${i}`,
          montant: Math.floor(Math.random() * 2000) + 100,
          date: new Date(
            2023,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          description: `Memory test revenue ${i}`,
          categorieRevenu: categorieRevenuId,
          utilisateur: userId,
          typeCompte: "Perso",
          estRecurrent: false,
        });
      }

      await DepenseModel.insertMany(expenses);
      await RevenuModel.insertMany(revenues);
    };
  });

  describe("Database Query Optimization", () => {
    it("should use efficient queries for large time ranges", async () => {
      const startTime = Date.now();

      const result = await StatistiquesService.getTotalFluxMensuel(
        userId,
        new Date(2023, 11, 1),
        new Date(2023, 11, 31),
        "depense",
        DepenseModel,
        { estChargeFixe: true }
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000);
      expect(typeof result).toBe("number");

      console.log(
        `Performance: Filtered query completed in ${executionTime}ms`
      );
    }, 10000);

    it("should handle pagination efficiently", async () => {
      const startTime = Date.now();

      const paginatedResults = [];
      for (let page = 0; page < 5; page++) {
        const result = await StatistiquesService.getRepartitionParCategorie(
          userId,
          new Date(2023, 11, 1),
          new Date(2023, 11, 31),
          "depense"
        );
        paginatedResults.push(result);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(paginatedResults).toHaveLength(5);

      console.log(
        `Performance: Paginated queries completed in ${executionTime}ms`
      );
    }, 15000);
  });

  describe("Stress Testing", () => {
    it("should handle extreme load gracefully", async () => {
      const startTime = Date.now();

      await createLargeDataset(10000, 10000);

      const operations = [
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2023, 11, 1), new Date(2023, 11, 31), "depense", DepenseModel),
        StatistiquesService.getTotalFluxMensuel(userId, new Date(2023, 11, 1), new Date(2023, 11, 31), "revenu", RevenuModel),
        StatistiquesService.getSoldePourPeriode(userId, new Date(2023, 11, 1), new Date(2023, 11, 31)),
        StatistiquesService.getRepartitionParCategorie(
          userId,
          new Date(2023, 11, 1),
          new Date(2023, 11, 31),
          "depense"
        ),
        StatistiquesService.getRepartitionParCategorie(
          userId,
          new Date(2023, 11, 1),
          new Date(2023, 11, 31),
          "revenu"
        ),
        StatistiquesService.getCategoriesEnHausse(userId, new Date(2023, 11, 1), new Date(2023, 11, 31)),
      ];

      const results = await Promise.all(operations);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(30000);
      expect(results).toHaveLength(6);

      console.log(
        `Stress test: 20,000 transactions processed in ${executionTime}ms`
      );
    }, 60000);

    const createLargeDataset = async (
      expenseCount: number,
      revenueCount: number
    ) => {
      const batchSize = 1000;

      for (
        let batch = 0;
        batch < Math.ceil(expenseCount / batchSize);
        batch++
      ) {
        const expenses = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, expenseCount);

        for (let i = batchStart; i < batchEnd; i++) {
          expenses.push({
            nom: `Stress Test Expense ${i}`,
            montant: Math.floor(Math.random() * 1000) + 10,
            date: new Date(
              2023,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ),
            description: `Stress test expense ${i}`,
            categorie: categorieId,
            utilisateur: userId,
            typeCompte: "Perso",
            estChargeFixe: i % 10 === 0,
          });
        }

        await DepenseModel.insertMany(expenses);
      }

      for (
        let batch = 0;
        batch < Math.ceil(revenueCount / batchSize);
        batch++
      ) {
        const revenues = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, revenueCount);

        for (let i = batchStart; i < batchEnd; i++) {
          revenues.push({
            nom: `Stress Test Revenue ${i}`,
            montant: Math.floor(Math.random() * 2000) + 100,
            date: new Date(
              2023,
              Math.floor(Math.random() * 12),
              Math.floor(Math.random() * 28) + 1
            ),
            description: `Stress test revenue ${i}`,
            categorieRevenu: categorieRevenuId,
            utilisateur: userId,
            typeCompte: "Perso",
            estRecurrent: i % 5 === 0,
          });
        }

        await RevenuModel.insertMany(revenues);
      }
    };
  });
});
