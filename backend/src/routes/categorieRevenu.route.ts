import { Router } from "express";
import { check } from "express-validator";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterCategorieRevenu,
  obtenirCategoriesRevenu,
  modifierCategorieRevenu,
  supprimerCategorieRevenu,
} from "../controllers/categorieRevenu.controller";
import { asyncHandler } from "../utils/async.utils";

const router = Router();

router.post(
  "/",
  proteger,
  [
    check("nom").notEmpty().withMessage("Le nom est requis"),
    check("description")
      .optional()
      .isString()
      .withMessage("La description doit être une chaîne de caractères"),
    check("image")
      .optional()
      .isString()
      .withMessage("L'image doit être une chaîne de caractères"),
  ],
  asyncHandler(ajouterCategorieRevenu),
);
router.get("/", proteger, asyncHandler(obtenirCategoriesRevenu));
router.put("/:id", proteger, asyncHandler(modifierCategorieRevenu));
router.put(
  "/:id",
  proteger,
  [
    check("nom").optional().notEmpty().withMessage("Le nom est requis"),
    check("description")
      .optional()
      .isString()
      .withMessage("La description doit être une chaîne de caractères"),
    check("image")
      .optional()
      .isString()
      .withMessage("L'image doit être une chaîne de caractères"),
  ],
  asyncHandler(modifierCategorieRevenu),
);
router.delete("/:id", proteger, asyncHandler(supprimerCategorieRevenu));

export default router;
