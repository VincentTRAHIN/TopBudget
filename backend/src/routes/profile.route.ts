import { Router } from "express";
import { proteger } from "../middlewares/auth.middleware";
import {
  updateUserProfile,
  uploadUserAvatar,
  changeUserPassword,
} from "../controllers/profile.controller";
import { uploadAvatar } from "../middlewares/upload.middleware";
import { asyncHandler } from "../utils/async.utils";

const router = Router();

router.put("/", proteger, asyncHandler(updateUserProfile));

router.post("/avatar", proteger, uploadAvatar, asyncHandler(uploadUserAvatar));

router.put("/me/change-password", proteger, asyncHandler(changeUserPassword));

export default router;
