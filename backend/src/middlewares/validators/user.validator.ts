import { body } from "express-validator";

export const registerValidator = [
  body("nom")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit contenir entre 2 et 50 caractères"),
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse").exists().withMessage("Mot de passe requis"),
];
