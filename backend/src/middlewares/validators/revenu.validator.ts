import { body } from "express-validator";
import { TypeCompteRevenu } from "../../types/revenu.types";

export const creerRevenuValidator = [
  body("montant")
    .isNumeric()
    .withMessage("Le montant doit être un nombre")
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage("Le montant doit être positif"),
  body("description")
    .notEmpty()
    .withMessage("La description du revenu est requise")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("La description doit contenir entre 2 et 100 caractères"),
  body("date")
    .isISO8601()
    .toDate()
    .withMessage("La date est invalide (format ISO8601 attendu)"),
  body("typeCompte")
    .isIn(["Perso", "Conjoint"] as TypeCompteRevenu[])
    .withMessage("Type de compte invalide pour le revenu"),
  body("commentaire")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne doit pas dépasser 500 caractères"),
  body("categorieRevenu")
    .notEmpty()
    .withMessage("La catégorie de revenu est requise")
    .isMongoId()
    .withMessage("ID de catégorie de revenu invalide"),
  body("estRecurrent")
    .optional()
    .isBoolean()
    .withMessage("Le champ estRecurrent doit être un booléen"),
];

export const modifierRevenuValidator = [
  body("montant")
    .optional()
    .isNumeric()
    .withMessage("Le montant doit être un nombre")
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage("Le montant doit être positif"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("La description du revenu ne peut pas être vide si fournie")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("La description doit contenir entre 2 et 100 caractères"),
  body("date")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("La date est invalide (format ISO8601 attendu)"),
  body("typeCompte")
    .optional()
    .isIn(["Perso", "Conjoint"] as TypeCompteRevenu[])
    .withMessage("Type de compte invalide pour le revenu"),
  body("commentaire")
    .optional({ checkFalsy: true }) // Permet de passer null ou une chaîne vide pour effacer le commentaire
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne doit pas dépasser 500 caractères"),
  body("categorieRevenu")
    .optional()
    .notEmpty()
    .withMessage("La catégorie de revenu ne peut pas être vide si fournie")
    .isMongoId()
    .withMessage("ID de catégorie de revenu invalide"),
  body("estRecurrent")
    .optional()
    .isBoolean()
    .withMessage("Le champ estRecurrent doit être un booléen"),
];
