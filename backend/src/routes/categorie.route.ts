import express from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterCategorie,
  obtenirCategories,
  modifierCategorie,
  supprimerCategorie,
} from "../controllers/categorie.controller";
import { creerCategorieValidator } from "../middlewares/validators/categorie.validator";
const router = express.Router();

// Créer une catégorie
router.post("/", proteger, creerCategorieValidator, ajouterCategorie);

// Lire toutes les catégories
router.get("/", proteger, obtenirCategories);

// Modifier une catégorie
router.put("/:id", proteger, modifierCategorie);

// Supprimer une catégorie
router.delete("/:id", proteger, supprimerCategorie);

export default router;
