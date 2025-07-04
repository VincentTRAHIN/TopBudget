import mongoose from 'mongoose';
import { ImportService } from '../services/import.service';
import DepenseModel from '../models/depense.model';
import RevenuModel from '../models/revenu.model';
import Categorie from '../models/categorie.model';
import CategorieRevenu from '../models/categorieRevenu.model';
import User from '../models/user.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockMongooseModel = any;

interface PopulatedCategorie {
  _id: mongoose.Types.ObjectId;
  nom: string;
  description: string;
}

interface PopulatedCategorieRevenu {
  _id: mongoose.Types.ObjectId;
  nom: string;
  description: string;
}

interface DepenseWithCategorie {
  _id: mongoose.Types.ObjectId;
  montant: number;
  description: string;
  categorie: PopulatedCategorie;
  utilisateur: mongoose.Types.ObjectId;
}

interface RevenuWithCategorieRevenu {
  _id: mongoose.Types.ObjectId;
  montant: number;
  description: string;
  categorieRevenu: PopulatedCategorieRevenu;
  utilisateur: mongoose.Types.ObjectId;
  estRecurrent: boolean;
}

describe('ImportService', () => {
  let testUserId: string;
  let testUserObjectId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const testUser = await User.create({
      nom: 'Test User',
      email: 'test@example.com',
      motDePasse: 'password123',
      role: 'Perso'
    });
    testUserId = (testUser._id as mongoose.Types.ObjectId).toString();
    testUserObjectId = testUser._id as mongoose.Types.ObjectId;
  });

  describe('processCsvImport', () => {
    it('should process valid CSV data correctly', async () => {
      const csvData = 'name,amount\nTest Item,100\nTest Item 2,200';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const mockProcessRowFn = jest.fn();
      mockProcessRowFn.mockResolvedValueOnce({ name: 'Test Item', amount: 100 });
      mockProcessRowFn.mockResolvedValueOnce({ name: 'Test Item 2', amount: 200 });

      const mockModel = {
        create: jest.fn().mockResolvedValue([])
      } as MockMongooseModel;

      const result = await ImportService.processCsvImport({
        csvBuffer,
        userId: testUserId,
        model: mockModel,
        entityName: 'TestEntity',
        csvHeaders: ['name', 'amount'],
        processRowFn: mockProcessRowFn
      });

      expect(result).toEqual({
        message: 'Import terminé. 2 TestEntitys importés. 0 erreurs.',
        totalLignesLues: 2,
        importedCount: 2,
        errorCount: 0,
        erreurs: []
      });

      expect(mockProcessRowFn).toHaveBeenCalledTimes(2);
      expect(mockModel.create).toHaveBeenCalledWith([
        { name: 'Test Item', amount: 100 },
        { name: 'Test Item 2', amount: 200 }
      ]);
    });

    it('should handle processing errors correctly', async () => {
      const csvData = 'name,amount\nValid Item,100\nInvalid Item,invalid';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const mockProcessRowFn = jest.fn();
      mockProcessRowFn.mockResolvedValueOnce({ name: 'Valid Item', amount: 100 });
      mockProcessRowFn.mockRejectedValueOnce(new Error('Invalid amount'));

      const mockModel = {
        create: jest.fn().mockResolvedValue([])
      } as MockMongooseModel;

      const result = await ImportService.processCsvImport({
        csvBuffer,
        userId: testUserId,
        model: mockModel,
        entityName: 'TestEntity',
        csvHeaders: ['name', 'amount'],
        processRowFn: mockProcessRowFn
      });

      expect(result).toEqual({
        message: 'Import terminé. 1 TestEntitys importés. 1 erreurs.',
        totalLignesLues: 2,
        importedCount: 1,
        errorCount: 1,
        erreurs: [{
          ligne: 2,
          data: { name: 'Invalid Item', amount: 'invalid' },
          erreur: 'Invalid amount'
        }]
      });

      expect(mockModel.create).toHaveBeenCalledWith([
        { name: 'Valid Item', amount: 100 }
      ]);
    });

    it('should handle database insertion errors', async () => {
      const csvData = 'name,amount\nTest Item,100';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const mockProcessRowFn = jest.fn();
      mockProcessRowFn.mockResolvedValueOnce({ name: 'Test Item', amount: 100 });

      const mockModel = {
        create: jest.fn().mockRejectedValue(new Error('Database error'))
      } as MockMongooseModel;

      await expect(ImportService.processCsvImport({
        csvBuffer,
        userId: testUserId,
        model: mockModel,
        entityName: 'TestEntity',
        csvHeaders: ['name', 'amount'],
        processRowFn: mockProcessRowFn
      })).rejects.toThrow('Database error');
    });

    it('should handle empty CSV correctly', async () => {
      const csvData = 'name,amount\n';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const mockProcessRowFn = jest.fn();
      const mockModel = {
        create: jest.fn().mockResolvedValue([])
      } as MockMongooseModel;

      const result = await ImportService.processCsvImport({
        csvBuffer,
        userId: testUserId,
        model: mockModel,
        entityName: 'TestEntity',
        csvHeaders: ['name', 'amount'],
        processRowFn: mockProcessRowFn
      });

      expect(result).toEqual({
        message: 'Import terminé. 0 TestEntitys importés. 0 erreurs.',
        totalLignesLues: 0,
        importedCount: 0,
        errorCount: 0,
        erreurs: []
      });

      expect(mockProcessRowFn).not.toHaveBeenCalled();
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    it('should handle null return values from processRowFn', async () => {
      const csvData = 'name,amount\nEmpty Row,0\nValid Item,100';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const mockProcessRowFn = jest.fn();
      mockProcessRowFn.mockResolvedValueOnce(null);
      mockProcessRowFn.mockResolvedValueOnce({ name: 'Valid Item', amount: 100 });

      const mockModel = {
        create: jest.fn().mockResolvedValue([])
      } as MockMongooseModel;

      const result = await ImportService.processCsvImport({
        csvBuffer,
        userId: testUserId,
        model: mockModel,
        entityName: 'TestEntity',
        csvHeaders: ['name', 'amount'],
        processRowFn: mockProcessRowFn
      });

      expect(result).toEqual({
        message: 'Import terminé. 1 TestEntitys importés. 0 erreurs.',
        totalLignesLues: 2,
        importedCount: 1,
        errorCount: 0,
        erreurs: []
      });

      expect(mockModel.create).toHaveBeenCalledWith([
        { name: 'Valid Item', amount: 100 }
      ]);
    });
  });

  describe('importDepensesCsv', () => {
    beforeEach(async () => {
      await Categorie.create({
        nom: 'Existing Category',
        description: 'Test category'
      });
    });

    it('should import valid expenses correctly', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,100.50,Existing Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(1);

      const createdExpense = await DepenseModel.findOne({ 
        utilisateur: testUserObjectId 
      }).populate('categorie') as DepenseWithCategorie | null;
      
      expect(createdExpense).toBeTruthy();
      expect(createdExpense?.montant).toBe(100.5);
      expect(createdExpense?.description).toBe('Test expense');
      expect(createdExpense?.categorie.nom).toBe('Existing Category');
    });

    it('should create new categories when they do not exist', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,100.50,New Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const categoriesCountBefore = await Categorie.countDocuments();
      
      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const categoriesCountAfter = await Categorie.countDocuments();
      expect(categoriesCountAfter).toBe(categoriesCountBefore + 1);

      const newCategory = await Categorie.findOne({ nom: 'New Category' });
      expect(newCategory).toBeTruthy();
      expect(newCategory?.description).toBe('Catégorie créée automatiquement lors de l\'import');
    });

    it('should handle invalid date format', async () => {
      const csvData = 'date,montant,categorie,description\n2024-01-15,100.50,Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Date invalide');
    });

    it('should handle invalid amount format', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,invalid,Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Montant invalide');
    });

    it('should handle missing required fields', async () => {
      const csvData = 'date,montant,categorie,description\n,100.50,Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Données manquantes');
    });

    it('should handle negative amounts', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,-100.50,Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Montant invalide');
    });

    it('should handle zero amounts', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,0,Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Montant invalide');
    });

    it('should handle comma as decimal separator', async () => {
      const csvData = 'date,montant,categorie,description\n15/01/2024,"100,50",Test Category,Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const createdExpense = await DepenseModel.findOne({ 
        utilisateur: testUserObjectId 
      });
      
      expect(createdExpense?.montant).toBe(100.5);
    });

    // EDGE CASE: Mixed valid and invalid rows
    it('should handle CSV files with mixed valid and invalid rows', async () => {
      const csvData = `date,montant,categorie,description
15/01/2024,100.50,Existing Category,Valid expense 1
invalid-date,200.75,Test Category,Invalid date row
20/01/2024,invalid-amount,Test Category,Invalid amount row
25/01/2024,300.25,Existing Category,Valid expense 2
,150.00,Test Category,Missing date row
30/01/2024,400.00,Existing Category,Valid expense 3`;

      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      // Should import only the 3 valid rows
      expect(result.importedCount).toBe(3);
      expect(result.errorCount).toBe(3);
      expect(result.totalLignesLues).toBe(6);

      // Check that errors are reported with correct line numbers
      expect(result.erreurs).toHaveLength(3);
      expect(result.erreurs[0].ligne).toBe(2); // invalid-date row
      expect(result.erreurs[0].erreur).toContain('Date invalide');
      expect(result.erreurs[1].ligne).toBe(3); // invalid-amount row
      expect(result.erreurs[1].erreur).toContain('Montant invalide');
      expect(result.erreurs[2].ligne).toBe(5); // missing date row
      expect(result.erreurs[2].erreur).toContain('Données manquantes');

      // Verify that valid expenses were actually created
      const createdExpenses = await DepenseModel.find({ 
        utilisateur: testUserObjectId 
      }).sort({ montant: 1 });
      
      expect(createdExpenses).toHaveLength(3);
      expect(createdExpenses[0].montant).toBe(100.5);
      expect(createdExpenses[1].montant).toBe(300.25);
      expect(createdExpenses[2].montant).toBe(400);
    });

    // EDGE CASE: Different delimiters/encoding issues
    it('should handle semicolon-separated CSV and fail gracefully', async () => {
      const csvData = 'date;montant;categorie;description\n15/01/2024;100.50;Test Category;Test expense';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      // With semicolon delimiter, the parser should treat entire row as one field
      // This should result in parsing errors
      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Données manquantes');
    });

    // EDGE CASE: Completely empty CSV file
    it('should handle completely empty CSV file', async () => {
      const csvData = '';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(0);
      expect(result.erreurs).toHaveLength(0);
      expect(result.message).toContain('0 dépenses importés');
    });

    // EDGE CASE: CSV with only headers (no data rows)
    it('should handle CSV with only headers and no data rows', async () => {
      const csvData = 'date,montant,categorie,description';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(0);
      expect(result.erreurs).toHaveLength(0);
      expect(result.message).toContain('0 dépenses importés');
    });

    it('should import multiple expenses correctly', async () => {
      const csvData = `date,montant,categorie,description
15/01/2024,100.50,Existing Category,Test expense 1
20/01/2024,200.75,New Category,Test expense 2
25/01/2024,150.25,Existing Category,Test expense 3`;
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importDepensesCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(3);

      const createdExpenses = await DepenseModel.find({ 
        utilisateur: testUserObjectId 
      }).populate('categorie');
      
      expect(createdExpenses).toHaveLength(3);
      expect(createdExpenses[0].montant).toBe(100.5);
      expect(createdExpenses[1].montant).toBe(200.75);
      expect(createdExpenses[2].montant).toBe(150.25);
    });
  });

  describe('importRevenusCsv', () => {
    beforeEach(async () => {
      await CategorieRevenu.create({
        nom: 'Existing Revenue Category',
        description: 'Test revenue category',
        utilisateur: testUserId
      });
    });

    it('should import valid revenues correctly', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\n15/01/2024,2000.00,Salary,Existing Revenue Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(1);

      const createdRevenue = await RevenuModel.findOne({ 
        utilisateur: testUserObjectId 
      }).populate('categorieRevenu') as RevenuWithCategorieRevenu | null;
      
      expect(createdRevenue).toBeTruthy();
      expect(createdRevenue?.montant).toBe(2000);
      expect(createdRevenue?.description).toBe('Salary');
      expect(createdRevenue?.categorieRevenu.nom).toBe('Existing Revenue Category');
      expect(createdRevenue?.estRecurrent).toBe(false);
    });

    it('should create new revenue categories when they do not exist', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\n15/01/2024,2000.00,Salary,New Revenue Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const categoriesCountBefore = await CategorieRevenu.countDocuments();
      
      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const categoriesCountAfter = await CategorieRevenu.countDocuments();
      expect(categoriesCountAfter).toBe(categoriesCountBefore + 1);

      const newCategory = await CategorieRevenu.findOne({ nom: 'New Revenue Category' });
      expect(newCategory).toBeTruthy();
      expect(newCategory?.description).toBe('Catégorie de revenu créée automatiquement lors de l\'import CSV.');
    });

    it('should handle different date formats', async () => {
      const csvData = `date,montant,description,categorie,type de compte,récurrent
15/01/2024,1000.00,Test Revenue 1,Test Category,Perso,non
2024-01-20,2000.00,Test Revenue 2,Test Category,Perso,non`;
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(2);
      expect(result.errorCount).toBe(0);

      const createdRevenues = await RevenuModel.find({ 
        utilisateur: testUserObjectId 
      }).sort({ montant: 1 });
      
      expect(createdRevenues).toHaveLength(2);
      expect(createdRevenues[0].montant).toBe(1000);
      expect(createdRevenues[1].montant).toBe(2000);
    });

    it('should handle boolean values for recurrent field', async () => {
      const csvData = `date,montant,description,categorie,type de compte,récurrent
15/01/2024,1000.00,Test Revenue 1,Test Category,Perso,oui
20/01/2024,2000.00,Test Revenue 2,Test Category,Perso,true
25/01/2024,3000.00,Test Revenue 3,Test Category,Perso,1
30/01/2024,4000.00,Test Revenue 4,Test Category,Perso,non`;
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(4);
      expect(result.errorCount).toBe(0);

      const createdRevenues = await RevenuModel.find({ 
        utilisateur: testUserObjectId 
      }).sort({ montant: 1 });
      
      expect(createdRevenues[0].estRecurrent).toBe(true);
      expect(createdRevenues[1].estRecurrent).toBe(true);
      expect(createdRevenues[2].estRecurrent).toBe(true);
      expect(createdRevenues[3].estRecurrent).toBe(false);
    });

    it('should handle invalid date format', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\ninvalid-date,2000.00,Salary,Test Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Format de date invalide');
    });

    it('should handle invalid amount format', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\n15/01/2024,invalid,Salary,Test Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Le montant du revenu doit être positif');
    });

    // EDGE CASE: Mixed valid and invalid rows for revenues
    it('should handle CSV files with mixed valid and invalid rows', async () => {
      const csvData = `date,montant,description,categorie,type de compte,récurrent
15/01/2024,2000.00,Valid Salary,Existing Revenue Category,Perso,non
invalid-date,1500.00,Invalid Date Revenue,Test Category,Perso,non
20/01/2024,invalid,Invalid Amount Revenue,Test Category,Perso,non
25/01/2024,3000.00,Valid Bonus,Existing Revenue Category,Perso,oui
,2500.00,Missing Date Revenue,Test Category,Perso,non
30/01/2024,4000.00,Valid Commission,Existing Revenue Category,Perso,non`;

      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      // Should import only the 3 valid rows
      expect(result.importedCount).toBe(3);
      expect(result.errorCount).toBe(3);
      expect(result.totalLignesLues).toBe(6);

      // Check that errors are reported with correct line numbers
      expect(result.erreurs).toHaveLength(3);
      expect(result.erreurs[0].ligne).toBe(2); // invalid-date row
      expect(result.erreurs[0].erreur).toContain('Format de date invalide');
      expect(result.erreurs[1].ligne).toBe(3); // invalid-amount row
      expect(result.erreurs[1].erreur).toContain('Le montant du revenu doit être positif');
      expect(result.erreurs[2].ligne).toBe(5); // missing date row
      expect(result.erreurs[2].erreur).toContain('Champs requis manquants');

      // Verify that valid revenues were actually created
      const createdRevenues = await RevenuModel.find({ 
        utilisateur: testUserObjectId 
      }).sort({ montant: 1 });
      
      expect(createdRevenues).toHaveLength(3);
      expect(createdRevenues[0].montant).toBe(2000);
      expect(createdRevenues[1].montant).toBe(3000);
      expect(createdRevenues[2].montant).toBe(4000);
    });

    // EDGE CASE: Completely empty CSV file for revenues
    it('should handle completely empty CSV file', async () => {
      const csvData = '';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(0);
      expect(result.erreurs).toHaveLength(0);
      expect(result.message).toContain('0 Revenus importés');
    });

    // EDGE CASE: CSV with only headers (no data rows) for revenues
    it('should handle CSV with only headers and no data rows', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(0);
      expect(result.erreurs).toHaveLength(0);
      expect(result.message).toContain('0 Revenus importés');
    });

    it('should handle missing required fields', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\n15/01/2024,,Salary,Test Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.erreurs[0].erreur).toContain('Champs requis manquants');
    });

    it('should handle empty rows', async () => {
      const csvData = `date,montant,description,categorie,type de compte,récurrent
15/01/2024,1000.00,Test Revenue,Test Category,Perso,non
,,,,
20/01/2024,2000.00,Test Revenue 2,Test Category,Perso,non`;
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.totalLignesLues).toBe(3);

      const createdRevenues = await RevenuModel.find({ 
        utilisateur: testUserObjectId 
      });
      
      expect(createdRevenues).toHaveLength(2);
    });

    it('should handle different account types', async () => {
      const csvData = `date,montant,description,categorie,type de compte,récurrent
15/01/2024,1000.00,Test Revenue 1,Test Category,Perso,non
20/01/2024,2000.00,Test Revenue 2,Test Category,Conjoint,non
25/01/2024,3000.00,Test Revenue 3,Test Category,InvalidType,non`;
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(3);
      expect(result.errorCount).toBe(0);

      const createdRevenues = await RevenuModel.find({ 
        utilisateur: testUserObjectId 
      }).sort({ montant: 1 });
      
      expect(createdRevenues[0].typeCompte).toBe('Perso');
      expect(createdRevenues[1].typeCompte).toBe('Conjoint');
      expect(createdRevenues[2].typeCompte).toBe('Perso');
    });

    it('should handle spaces in monetary values', async () => {
      const csvData = 'date,montant,description,categorie,type de compte,récurrent\n15/01/2024,"2 000,50",Salary,Test Category,Perso,non';
      const csvBuffer = Buffer.from(csvData, 'utf8');

      const result = await ImportService.importRevenusCsv(csvBuffer, testUserId);

      expect(result.importedCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const createdRevenue = await RevenuModel.findOne({ 
        utilisateur: testUserObjectId 
      });
      
      expect(createdRevenue?.montant).toBe(2000.5);
    });
  });
}); 