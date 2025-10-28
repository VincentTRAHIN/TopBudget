import { Router } from "express";
import { proteger } from "../../middlewares/auth.middleware";
import {
  ajouterDepense,
  obtenirDepenses,
  modifierDepense,
  supprimerDepense,
  supprimerToutesDepenses,
  importerDepenses,
  toggleChargeFixe,
} from "../../controllers/depense.controller";
import { creerDepenseValidator } from "../../middlewares/validators/depense.validator";
import uploadCSV from "../../middlewares/upload.middleware";
import { asyncHandler } from "../../utils/async.utils";

const router = Router();

router.post("/", proteger, creerDepenseValidator, asyncHandler(ajouterDepense));
router.get("/", proteger, asyncHandler(obtenirDepenses));
router.put("/:id", proteger, asyncHandler(modifierDepense));
router.patch("/:id/toggle-charge-fixe", proteger, asyncHandler(toggleChargeFixe));

router.delete("/:id", proteger, asyncHandler(supprimerDepense));
router.delete("/", proteger, asyncHandler(supprimerToutesDepenses));

router.post("/import", proteger, uploadCSV, asyncHandler(importerDepenses));

export default router;
