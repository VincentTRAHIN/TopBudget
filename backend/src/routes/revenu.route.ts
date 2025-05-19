import { Router } from "express";
import { check } from "express-validator";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterRevenu,
  obtenirRevenus,
  obtenirRevenuParId,
  modifierRevenu,
  supprimerRevenu,
  importerRevenus,
} from "../controllers/revenu.controller";
import uploadCSV from "../middlewares/upload.middleware";
import { asyncHandler } from "../utils/async.utils";

const router = Router();

router.post(
  "/",
  proteger,
  [
    check('montant').isNumeric().withMessage('Le montant doit être un nombre'),
    check('description').notEmpty().withMessage('La description est requise'),
    check('date').isISO8601().withMessage('La date doit être au format ISO'),
    check('typeCompte').isIn(['Compte courant', 'Épargne', 'Investissement']).withMessage('Type de compte invalide'),
    check('categorieRevenu').notEmpty().withMessage('La catégorie est requise'),
  ],
  asyncHandler(ajouterRevenu),
);
router.get("/", proteger, asyncHandler(obtenirRevenus));
router.get("/:id", proteger, asyncHandler(obtenirRevenuParId));
router.put(
  "/:id",
  proteger,
  [
    check('montant').optional().isNumeric().withMessage('Le montant doit être un nombre'),
    check('description').optional().notEmpty().withMessage('La description est requise'),
    check('date').optional().isISO8601().withMessage('La date doit être au format ISO'),
    check('typeCompte').optional().isIn(['Compte courant', 'Épargne', 'Investissement']).withMessage('Type de compte invalide'),
    check('categorieRevenu').optional().notEmpty().withMessage('La catégorie est requise'),
  ],
  asyncHandler(modifierRevenu),
);
router.delete("/:id", proteger, asyncHandler(supprimerRevenu));
router.post("/import", proteger, uploadCSV, asyncHandler(importerRevenus));

export default router;
