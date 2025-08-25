import { Router } from "express";
import { proteger } from "../../middlewares/auth.middleware";
import {
  ajouterCategorie,
  obtenirCategories,
  modifierCategorie,
  supprimerCategorie,
} from "../../controllers/categorie.controller";
import { creerCategorieValidator } from "../../middlewares/validators/categorie.validator";
import { asyncHandler } from "../../utils/async.utils";

const router = Router();

router.post(
  "/",
  proteger,
  creerCategorieValidator,
  asyncHandler(ajouterCategorie),
);

router.get("/", proteger, asyncHandler(obtenirCategories));

router.put("/:id", proteger, asyncHandler(modifierCategorie));

router.delete("/:id", proteger, asyncHandler(supprimerCategorie));

export default router;
