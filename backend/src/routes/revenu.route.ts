import { Router } from "express";
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
import { creerRevenuValidator, modifierRevenuValidator } from "../middlewares/validators/revenu.validator";

const router = Router();

router.post(
  "/",
  proteger,
  creerRevenuValidator,
  asyncHandler(ajouterRevenu),
);
router.get("/", proteger, asyncHandler(obtenirRevenus));
router.get("/:id", proteger, asyncHandler(obtenirRevenuParId));
router.put(
  "/:id",
  proteger,
  modifierRevenuValidator,
  asyncHandler(modifierRevenu),
);
router.delete("/:id", proteger, asyncHandler(supprimerRevenu));
router.post("/import", proteger, uploadCSV, asyncHandler(importerRevenus));

export default router;
