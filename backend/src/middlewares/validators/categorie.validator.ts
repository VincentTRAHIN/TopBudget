import { body } from 'express-validator';

export const creerCategorieValidator = [
  body('nom').notEmpty().withMessage('Le nom de la catégorie est requis')
];
