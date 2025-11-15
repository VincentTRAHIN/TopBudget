import { ImportServiceV2 } from '../services/importEnhanced.service';
import mongoose from 'mongoose';
import {describe, it, expect, beforeAll, afterAll} from '@jest/globals';

describe('ImportServiceV2', () => {
  beforeAll(async () => {
    // Configuration de test MongoDB si nécessaire
  });

  afterAll(async () => {
    // Nettoyage si nécessaire
  });

  describe('importDepensesFromCSV', () => {
    it('✅ devrait importer correctement un CSV avec en-têtes valides', async () => {
      const csvContent = `Date,Montant,Categorie,Description
2025-01-01,50.00,Alimentation,Courses du matin
2025-01-02,25.50,Transport,Ticket de bus`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        totalLines: 2,
        successCount: expect.any(Number),
        errorCount: expect.any(Number),
        errors: expect.any(Array),
        message: expect.any(String),
      });
    });

    it('🐛 devrait détecter les en-têtes manquants', async () => {
      const csvContent = `Description,Prix
Courses du matin,50.00
Ticket de bus,25.50`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      console.log(result.errors);
      
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].erreurs[0]).toContain('En-têtes requis manquants');
      expect(result.errors[0].erreurs[0]).toContain('date');
      expect(result.errors[0].erreurs[0]).toContain('montant');
      expect(result.errors[0].erreurs[0]).toContain('categorie');
    });

    it('🐛 devrait détecter les données manquantes avec contexte', async () => {
      const csvContent = `Date,Montant,Categorie,Description
,50.00,Alimentation,Courses
2025-01-02,,Transport,Bus
2025-01-03,25.50,,Metro`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Vérifier les erreurs spécifiques
      const errorMessages = result.errors.flatMap(e => e.erreurs);
      expect(errorMessages).toContain('Date manquante');
      expect(errorMessages).toContain('Montant manquant');
      expect(errorMessages).toContain('Catégorie manquante');
    });

    it('🐛 devrait détecter les formats de date invalides', async () => {
      const csvContent = `Date,Montant,Categorie
invalid-date,50.00,Alimentation
32/13/2025,25.50,Transport`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => 
        e.erreurs.some(err => err.includes('Date invalide'))
      )).toBe(true);
    });

    it('🐛 devrait détecter les montants invalides', async () => {
      const csvContent = `Date,Montant,Categorie
2025-01-01,invalid-amount,Alimentation
2025-01-02,abc€,Transport`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => 
        e.erreurs.some(err => err.includes('Montant invalide'))
      )).toBe(true);
    });

    it('✅ devrait accepter différents formats de date', async () => {
      const csvContent = `Date,Montant,Categorie
2025-01-01,50.00,Alimentation
01/01/2025,25.50,Transport
01-01-2025,75.00,Loisirs`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      // Doit accepter différents formats de date
      expect(result.errorCount).toBe(0);
    });

    it('✅ devrait normaliser les en-têtes avec aliases', async () => {
      const csvContent = `Jour,Prix,Category,Libelle
2025-01-01,50.00,Alimentation,Courses`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      // Les aliases devraient être reconnus
      expect(result.success || result.errorCount === 0).toBe(true);
    });

    it('📊 devrait fournir des statistiques détaillées', async () => {
      const csvContent = `Date,Montant,Categorie,Description
2025-01-01,50.00,Alimentation,Courses

2025-01-02,25.50,Transport,Bus`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result.statistiques).toMatchObject({
        lignesAvecEntetes: 1,
        lignesVides: expect.any(Number),
        lignesValides: expect.any(Number),
      });
    });

    it('📄 devrait gérer un fichier CSV vide', async () => {
      const csvContent = '';
      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Fichier CSV vide');
      expect(result.totalLines).toBe(0);
    });
  });

  describe('Validation des types', () => {
    it('✅ devrait valider les types de compte', async () => {
      const csvContent = `Date,Montant,Categorie,TypeCompte
2025-01-01,50.00,Alimentation,Perso
2025-01-02,25.50,Transport,Conjoint
2025-01-03,75.00,Loisirs,InvalidType`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      // Doit détecter le type de compte invalide
      expect(result.errors.some(e => 
        e.erreurs.some(err => err.includes('Type de compte invalide'))
      )).toBe(true);
    });

    it('✅ devrait valider les types de dépense', async () => {
      const csvContent = `Date,Montant,Categorie,TypeDepense
2025-01-01,50.00,Alimentation,Perso
2025-01-02,25.50,Transport,Commune
2025-01-03,75.00,Loisirs,InvalidType`;

      const csvBuffer = Buffer.from(csvContent, 'utf-8');
      const userId = 'test-user-123';

      const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, userId);
      
      // Doit détecter le type de dépense invalide
      expect(result.errors.some(e => 
        e.erreurs.some(err => err.includes('Type de dépense invalide'))
      )).toBe(true);
    });
  });
});
