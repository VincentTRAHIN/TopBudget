import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterCategorie,
  obtenirCategories,
  modifierCategorie,
  supprimerCategorie,
} from "../controllers/categorie.controller";
import { creerCategorieValidator } from "../middlewares/validators/categorie.validator";
import { asyncHandler } from '../utils/async.utils';

const router = Router();

// Créer une catégorie
router.post("/", proteger, creerCategorieValidator, asyncHandler(ajouterCategorie));

// Lire toutes les catégories
router.get("/", proteger, asyncHandler(obtenirCategories));

// Modifier une catégorie
router.put("/:id", proteger, asyncHandler(modifierCategorie));

// Supprimer une catégorie
router.delete("/:id", proteger, asyncHandler(supprimerCategorie));

export default router;
