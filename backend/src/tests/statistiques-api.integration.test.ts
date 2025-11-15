/**
 * Tests d'intégration pour les nouveaux endpoints /api/statistiques/*
 * 
 * Endpoints testés :
 * - GET /api/statistiques/upcoming-charges
 * - GET /api/statistiques/last-sync
 * - GET /api/statistiques/expenses-trends
 * - GET /api/statistiques/comparaison-mois (existant, validation)
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import User from '../models/user.model';
import Depense from '../models/depense.model';
import Revenu from '../models/revenu.model';
import Categorie from '../models/categorie.model';
import CategorieRevenu from '../models/categorieRevenu.model';
import {describe, it, expect, beforeAll, afterAll, beforeEach} from '@jest/globals';

describe('Statistiques API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let categorieId: string;
  let categorieRevenuId: string;

  beforeAll(async () => {
    // Démarrer MongoDB en mémoire
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Déconnecter si déjà connecté
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Nettoyer la base de données
    await User.deleteMany({});
    await Depense.deleteMany({});
    await Revenu.deleteMany({});
    await Categorie.deleteMany({});
    await CategorieRevenu.deleteMany({});

    // Créer une catégorie de dépense
    const categorie = await Categorie.create({
      nom: 'Alimentation',
      couleur: '#FF5733',
    });
    categorieId = `${categorie._id}`;

    // Créer une catégorie de revenu
    const categorieRevenu = await CategorieRevenu.create({
      nom: 'Salaire',
      couleur: '#33FF57',
    });
    categorieRevenuId = `${categorieRevenu._id}`;
    // Créer un utilisateur de test
    const userResponse = await request(app)
      .post('/api/users/register')
      .send({
        nom: 'Test',
        prenom: 'User',
        email: 'test@topbudget.com',
        password: 'Test123!',
      });

    userId = userResponse.body.user._id;

    // Se connecter pour obtenir le token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@topbudget.com',
        password: 'Test123!',
      });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/statistiques/upcoming-charges', () => {
    it('should return upcoming charges for the current month', async () => {
      const today = new Date();
      const currentDay = today.getDate();

      // Créer une charge fixe payée (avant aujourd'hui)
      await Depense.create({
        montant: 500,
        description: 'Loyer',
        categorieId,
        userId,
        date: new Date(today.getFullYear(), today.getMonth(), currentDay - 5),
        estChargeFixe: true,
        frequenceCharge: 'mensuelle',
        jourCharge: currentDay - 5,
      });

      // Créer une charge fixe à venir (après aujourd'hui)
      await Depense.create({
        montant: 100,
        description: 'Abonnement Netflix',
        categorieId,
        userId,
        date: new Date(today.getFullYear(), today.getMonth(), currentDay + 10),
        estChargeFixe: true,
        frequenceCharge: 'mensuelle',
        jourCharge: currentDay + 10,
      });

      const response = await request(app)
        .get('/api/statistiques/upcoming-charges')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('chargesPayees');
      expect(response.body).toHaveProperty('chargesAVenir');
      expect(response.body).toHaveProperty('totalPayees');
      expect(response.body).toHaveProperty('totalAVenir');
      expect(response.body).toHaveProperty('totalMois');

      expect(response.body.chargesPayees.length).toBeGreaterThanOrEqual(0);
      expect(response.body.chargesAVenir.length).toBeGreaterThanOrEqual(0);
      expect(response.body.totalMois).toBe(600); // 500 + 100
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/statistiques/upcoming-charges')
        .query({ contexte: 'moi' });

      expect(response.status).toBe(401);
    });

    it('should handle empty charges list', async () => {
      const response = await request(app)
        .get('/api/statistiques/upcoming-charges')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body.chargesPayees).toEqual([]);
      expect(response.body.chargesAVenir).toEqual([]);
      expect(response.body.totalPayees).toBe(0);
      expect(response.body.totalAVenir).toBe(0);
      expect(response.body.totalMois).toBe(0);
    });
  });

  describe('GET /api/statistiques/last-sync', () => {
    it('should return the last sync date (last expense added)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const today = new Date();

      // Créer une dépense d'hier
      await Depense.create({
        montant: 50,
        description: 'Courses',
        categorieId,
        userId,
        date: yesterday,
      });

      // Créer une dépense d'aujourd'hui
      await Depense.create({
        montant: 30,
        description: 'Restaurant',
        categorieId,
        userId,
        date: today,
      });

      const response = await request(app)
        .get('/api/statistiques/last-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('derniereSynchronisation');
      expect(response.body).toHaveProperty('joursDepuisSync');

      // La dernière sync devrait être aujourd'hui
      const lastSyncDate = new Date(response.body.derniereSynchronisation);
      expect(lastSyncDate.getDate()).toBe(today.getDate());
      expect(response.body.joursDepuisSync).toBe(0);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/statistiques/last-sync')
        .query({ contexte: 'moi' });

      expect(response.status).toBe(401);
    });

    it('should return null if no expenses exist', async () => {
      const response = await request(app)
        .get('/api/statistiques/last-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body.derniereSynchronisation).toBeNull();
      expect(response.body.joursDepuisSync).toBeNull();
    });
  });

  describe('GET /api/statistiques/expenses-trends', () => {
    it('should return expense trends for top categories', async () => {
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);

      // Créer des dépenses du mois actuel
      await Depense.create({
        montant: 500,
        description: 'Courses',
        categorieId,
        userId,
        date: currentMonth,
      });

      // Créer des dépenses du mois précédent
      await Depense.create({
        montant: 300,
        description: 'Courses',
        categorieId,
        userId,
        date: previousMonth,
      });

      const response = await request(app)
        .get('/api/statistiques/expenses-trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ nbMois: 6, contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('topCategories');
      expect(response.body).toHaveProperty('evolutionMensuelle');

      expect(Array.isArray(response.body.topCategories)).toBeTruthy();
      expect(Array.isArray(response.body.evolutionMensuelle)).toBeTruthy();

      // Vérifier la structure des topCategories
      if (response.body.topCategories.length > 0) {
        const category = response.body.topCategories[0];
        expect(category).toHaveProperty('categorieId');
        expect(category).toHaveProperty('nom');
        expect(category).toHaveProperty('totalActuel');
        expect(category).toHaveProperty('totalPrecedent');
        expect(category).toHaveProperty('variation');
        expect(category).toHaveProperty('variationPourcent');
        expect(category).toHaveProperty('tendance');
        expect(['hausse', 'baisse', 'stable']).toContain(category.tendance);
      }
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/statistiques/expenses-trends')
        .query({ nbMois: 6, contexte: 'moi' });

      expect(response.status).toBe(401);
    });

    it('should handle nbMois parameter correctly', async () => {
      const response = await request(app)
        .get('/api/statistiques/expenses-trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ nbMois: 3, contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body.evolutionMensuelle.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /api/statistiques/comparaison-mois', () => {
    it('should return monthly comparison data (existing endpoint validation)', async () => {
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);

      // Créer des dépenses et revenus pour les 2 mois
      await Depense.create({
        montant: 500,
        description: 'Courses',
        categorieId,
        userId,
        date: currentMonth,
      });

      await Revenu.create({
        montant: 2000,
        description: 'Salaire',
        categorieRevenuId,
        userId,
        date: currentMonth,
      });

      const response = await request(app)
        .get('/api/statistiques/comparaison-mois')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'depenses', contexte: 'moi' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('moisActuel');
      expect(response.body).toHaveProperty('moisPrecedent');
      expect(response.body).toHaveProperty('variation');
      expect(response.body).toHaveProperty('variationPourcent');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/statistiques/comparaison-mois')
        .query({ type: 'depenses', contexte: 'moi' });

      expect(response.status).toBe(401);
    });

    it('should handle different types (depenses, revenus, solde)', async () => {
      const types = ['depenses', 'revenus', 'solde'];

      for (const type of types) {
        const response = await request(app)
          .get('/api/statistiques/comparaison-mois')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ type, contexte: 'moi' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('moisActuel');
        expect(response.body).toHaveProperty('moisPrecedent');
      }
    });
  });

  describe('Contexte Couple - Integration Tests', () => {
    let partnerId: string;

    beforeEach(async () => {
      // Créer un partenaire
      const partnerResponse = await request(app)
        .post('/api/users/register')
        .send({
          nom: 'Partner',
          prenom: 'Test',
          email: 'partner@topbudget.com',
          password: 'Test123!',
        });

      partnerId = partnerResponse.body.user._id;

      // Associer le partenaire à l'utilisateur principal
      await User.findByIdAndUpdate(userId, { partenaireId: partnerId });
    });

    it('should return combined data for couple context in upcoming-charges', async () => {
      // Créer une charge pour l'utilisateur principal
      await Depense.create({
        montant: 500,
        description: 'Loyer',
        categorieId,
        userId,
        date: new Date(),
        estChargeFixe: true,
        frequenceCharge: 'mensuelle',
        jourCharge: 1,
      });

      // Créer une charge pour le partenaire
      await Depense.create({
        montant: 100,
        description: 'Abonnement',
        categorieId,
        userId: partnerId,
        date: new Date(),
        estChargeFixe: true,
        frequenceCharge: 'mensuelle',
        jourCharge: 15,
      });

      const response = await request(app)
        .get('/api/statistiques/upcoming-charges')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ contexte: 'couple' });

      expect(response.status).toBe(200);
      expect(response.body.totalMois).toBeGreaterThanOrEqual(600); // 500 + 100
    });

    it('should return combined data for couple context in expenses-trends', async () => {
      const currentMonth = new Date();

      // Créer des dépenses pour l'utilisateur principal
      await Depense.create({
        montant: 500,
        description: 'Courses',
        categorieId,
        userId,
        date: currentMonth,
      });

      // Créer des dépenses pour le partenaire
      await Depense.create({
        montant: 300,
        description: 'Restaurant',
        categorieId,
        userId: partnerId,
        date: currentMonth,
      });

      const response = await request(app)
        .get('/api/statistiques/expenses-trends')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ nbMois: 6, contexte: 'couple' });

      expect(response.status).toBe(200);
      expect(response.body.topCategories.length).toBeGreaterThanOrEqual(1);
    });
  });
});
