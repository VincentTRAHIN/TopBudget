import { body } from "express-validator";

export const creerCategorieRevenuValidator = [
  body("nom")
    .notEmpty()
    .withMessage("Le nom de la catégorie de revenu est requis")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit contenir entre 2 et 50 caractères"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La description ne doit pas dépasser 200 caractères"),
  body("image")
    .optional()
    .isURL()
    .withMessage("Format d'URL invalide pour l'image"),
];
