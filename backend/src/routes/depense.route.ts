import express from 'express';
import { proteger } from '../middlewares/auth.middleware';
import { ajouterDepense, obtenirDepenses, modifierDepense, supprimerDepense } from '../controllers/depense.controller';
import { body } from 'express-validator';

const router = express.Router();

// Créer une dépense
router.post(
  '/',
  proteger,
  [
    body('montant').isNumeric().withMessage('Le montant est requis et doit être un nombre'),
    body('date').isISO8601().withMessage('La date est requise et valide'),
    body('typeCompte').isIn(['Perso', 'Conjoint', 'Commun']).withMessage('Type de compte invalide'),
    body('categorie').notEmpty().withMessage('La catégorie est requise')
  ],
  ajouterDepense
);

// Lire toutes les dépenses de l'utilisateur
router.get('/', proteger, obtenirDepenses);

// Modifier une dépense
router.put('/:id', proteger, modifierDepense);

// Supprimer une dépense
router.delete('/:id', proteger, supprimerDepense);

export default router;
