import { Response, NextFunction } from "express";
import { importDepensesCsvOptimized, importRevenusCsvOptimized } from "../services/importOptimized.service";
import {  COMMON, AUTH } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { sendSuccess } from "../utils/response.utils";
import { AuthRequest } from "../middlewares/auth.middleware";

interface MulterRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const importCsvAuto = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next(new AppError(COMMON.ERRORS.NO_CSV_FILE, 400));
  if (!req.user) return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
  try {
    const bufferDepense = Buffer.from(req.file.buffer);
    const bufferRevenu = Buffer.from(req.file.buffer);
    const depenseResult = await importDepensesCsvOptimized(bufferDepense, req.user.id);
    const revenuResult = await importRevenusCsvOptimized(bufferRevenu, req.user.id);
    sendSuccess(res, "Import CSV terminé", {
      depenses: depenseResult,
      revenus: revenuResult
    });
  } catch (error) {
    next(error);
  }
};
