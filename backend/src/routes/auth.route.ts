import express from "express";
import { inscription as inscriptionController, connexion as connexionController, getMe as getMeController } from "../controllers/auth.controller";import { loginValidator, registerValidator } from "../middlewares/validators/user.validator";
import { proteger } from "../middlewares/auth.middleware";

const router = express.Router();

router.post(
  "/register",
  registerValidator,
  inscriptionController
);

router.post(
  "/login",
  loginValidator,
  connexionController
);
console.log("Chargement de auth.route.ts..."); 
router.get(
  "/me",
  (req, res, next) => {
      console.log(`>>> REQUETE RECUE : GET /api/auth/me (avant proteger)`); // CE LOG EST-IL VISIBLE ?
      next();
  },
  proteger,
  getMeController
);

export default router;
