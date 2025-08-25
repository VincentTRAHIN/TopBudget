import { Router } from "express";
import {
  inscription as inscriptionController,
  connexion as connexionController,
  getMe as getMeController,
} from "../../controllers/auth.controller";
import {
  loginValidator,
  registerValidator,
} from "../../middlewares/validators/user.validator";
import { proteger } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async.utils";

const router = Router();

router.post(
  "/inscription",
  registerValidator,
  asyncHandler(inscriptionController),
);

router.post("/connexion", loginValidator, asyncHandler(connexionController));

router.get("/me", proteger, asyncHandler(getMeController));

export default router;
