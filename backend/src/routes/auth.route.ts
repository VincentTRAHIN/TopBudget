import express from "express";
import { inscription, connexion } from "../controllers/auth.controller";
import { loginValidator, registerValidator } from "../middlewares/validators/user.validator";

const router = express.Router();

router.post(
  "/register",
  registerValidator,
  inscription
);

router.post(
  "/login",
  loginValidator,
  connexion
);

export default router;
