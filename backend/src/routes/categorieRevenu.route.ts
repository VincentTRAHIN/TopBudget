import express from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterCategorieRevenu,
  obtenirCategoriesRevenu,
  modifierCategorieRevenu,
  supprimerCategorieRevenu,
} from "../controllers/categorieRevenu.controller";
import { creerCategorieRevenuValidator } from "../middlewares/validators/categorieRevenu.validator";

const router = express.Router();

// Créer une catégorie de revenu
router.post(
  "/",
  proteger,
  creerCategorieRevenuValidator,
  ajouterCategorieRevenu,
);
// Obtenir toutes les catégories de revenus
router.get("/", proteger, obtenirCategoriesRevenu);
// Modifier une catégorie de revenu
router.put("/:id", proteger, modifierCategorieRevenu);
// Supprimer une catégorie de revenu
router.delete("/:id", proteger, supprimerCategorieRevenu);

export default router;
