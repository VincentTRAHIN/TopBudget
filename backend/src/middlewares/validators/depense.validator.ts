import { body } from 'express-validator';

export const creerDepenseValidator = [
  body('montant').isNumeric().withMessage('Le montant doit être un nombre'),
  body('categorie').notEmpty().withMessage('La catégorie est requise'),
  body('typeCompte').isIn(['Perso', 'Conjoint', 'Commun']).withMessage('Le type de compte est invalide'),
  body('date').isISO8601().toDate().withMessage('La date est invalide')
];
