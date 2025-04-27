import express from "express";
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
const router = express.Router();

// Créer une dépense
router.post("/", proteger, creerDepenseValidator, ajouterDepense);

// Lire toutes les dépenses de l'utilisateur
router.get("/", proteger, obtenirDepenses);

// Modifier une dépense
router.put("/:id", proteger, modifierDepense);

// Supprimer une dépense
router.delete("/:id", proteger, supprimerDepense);

// Importer des dépenses
router.post("/import", proteger, uploadCSV, importerDepenses);

export default router;
