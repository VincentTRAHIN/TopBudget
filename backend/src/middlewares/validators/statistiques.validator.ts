import { query } from "express-validator";

export const validateDateRange = [
  query("dateDebut")
    .isISO8601()
    .withMessage("La date de début doit être au format ISO 8601"),
  query("dateFin")
    .isISO8601()
    .withMessage("La date de fin doit être au format ISO 8601"),
];

export const validateType = [
  query("type")
    .isIn(["depense", "revenu", "depenses", "revenus", "solde"])
    .withMessage(
      "Le type doit être 'depense', 'revenu', 'depenses', 'revenus' ou 'solde'",
    ),
];

export const validateEvolutionFlux = [
  ...validateType,
  query("nbMois")
    .isInt({ min: 1, max: 12 })
    .withMessage("Le nombre de mois doit être compris entre 1 et 12"),
  query("dateReference")
    .isISO8601()
    .withMessage("La date de référence doit être au format ISO 8601"),
  query("estRecurrent")
    .optional()
    .isBoolean()
    .withMessage("estRecurrent doit être un booléen"),
];

export const validateComparaisonMois = [
  ...validateType,
  query("dateActuelle")
    .isISO8601()
    .withMessage("La date actuelle doit être au format ISO 8601"),
  query("datePrecedente")
    .isISO8601()
    .withMessage("La date précédente doit être au format ISO 8601"),
];
