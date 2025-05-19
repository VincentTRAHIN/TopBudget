import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterDepense,
  obtenirDepenses,
  modifierDepense,
  supprimerDepense,
  importerDepenses,
} from "../controllers/depense.controller";
import { creerDepenseValidator } from "../middlewares/validators/depense.validator";
import uploadCSV from "../middlewares/upload.middleware";
import { asyncHandler } from '../utils/async.utils';

const router = Router();

// Créer une dépense
router.post("/", proteger, creerDepenseValidator, asyncHandler(ajouterDepense));

// Lire toutes les dépenses de l'utilisateur
router.get("/", proteger, asyncHandler(obtenirDepenses));

// Modifier une dépense
router.put("/:id", proteger, asyncHandler(modifierDepense));

// Supprimer une dépense
router.delete("/:id", proteger, asyncHandler(supprimerDepense));

// Importer des dépenses
router.post("/import", proteger, uploadCSV, asyncHandler(importerDepenses));

export default router;
