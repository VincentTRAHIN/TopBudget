import express, { Request, Response, NextFunction } from "express";
import { proteger, AuthRequest } from "../middlewares/auth.middleware";
import {
  ajouterRevenu,
  obtenirRevenus,
  obtenirRevenuParId,
  modifierRevenu,
  supprimerRevenu,
  importerRevenus,
} from "../controllers/revenu.controller";
import {
  creerRevenuValidator,
  modifierRevenuValidator,
} from "../middlewares/validators/revenu.validator";
import uploadCSV from "../middlewares/upload.middleware";

const router = express.Router();

type AuthHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

function adaptAuthHandler(handler: AuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(handler(req as AuthRequest, res, next)).catch(next);
  };
}

router.post(
  "/",
  proteger,
  creerRevenuValidator,
  adaptAuthHandler(ajouterRevenu),
);
router.get("/", proteger, adaptAuthHandler(obtenirRevenus));
router.get("/:id", proteger, adaptAuthHandler(obtenirRevenuParId));
router.put(
  "/:id",
  proteger,
  modifierRevenuValidator,
  adaptAuthHandler(modifierRevenu),
);
router.delete("/:id", proteger, adaptAuthHandler(supprimerRevenu));
router.post("/import", proteger, uploadCSV, adaptAuthHandler(importerRevenus));

export default router;
