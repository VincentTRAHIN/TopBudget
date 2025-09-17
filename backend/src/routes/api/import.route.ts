import { Router } from "express";
import { proteger } from "../../middlewares/auth.middleware";
import uploadCSV from "../../middlewares/upload.middleware";
import { asyncHandler } from "../../utils/async.utils";
import { importCsvAuto } from "../../controllers/import.controller";

const router = Router();

router.post("/", proteger, uploadCSV, asyncHandler(importCsvAuto));

export default router;
