import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import { searchUser } from "../controllers/user.controller";
import { asyncHandler } from "../utils/async.utils";

const router = Router();

// Recherche d'utilisateur par email ou nom
router.get("/search", proteger, asyncHandler(searchUser));

export default router;
