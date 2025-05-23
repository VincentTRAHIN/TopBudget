import { Router } from "express";
import { check } from "express-validator";
import { proteger } from "../middlewares/auth.middleware";
import {
  ajouterCategorieRevenu,
  obtenirCategoriesRevenu,
  obtenirCategorieRevenuParId,
  modifierCategorieRevenu,
  supprimerCategorieRevenu,
} from "../controllers/categorieRevenu.controller";
import { asyncHandler } from "../utils/async.utils";

const router = Router();

router.use(proteger);

router.post(
  "/",
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
router.get("/", asyncHandler(obtenirCategoriesRevenu));

router.get("/:id", asyncHandler(obtenirCategorieRevenuParId));
router.put(
  "/:id",
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
router.delete("/:id", asyncHandler(supprimerCategorieRevenu));

export default router;
