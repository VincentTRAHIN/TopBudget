import { Response, NextFunction } from "express";
import { ImportServiceV2 } from "../services/importEnhanced.service";
import {  COMMON, AUTH } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
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
    const csvBuffer = Buffer.from(req.file.buffer);
    
    // Essayer d'importer comme dépenses d'abord
    const depenseResult = await ImportServiceV2.importDepensesFromCSV(csvBuffer, req.user.id);
    
    // Si l'import des dépenses a échoué à cause des en-têtes, essayer les revenus
    if (!depenseResult.success && depenseResult.errors.some(e => e.contexte === 'Format de fichier CSV')) {
      const revenuResult = await ImportServiceV2.importRevenusFromCSV(csvBuffer, req.user.id);
      
      if (revenuResult.success) {
        return sendSuccess(res, revenuResult.message, {
          type: 'revenus',
          result: revenuResult
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Format de fichier non reconnu",
          errorsDepenses: depenseResult.errors,
          errorsRevenus: revenuResult.errors
        });
      }
    }
    
    // Retourner le résultat des dépenses (succès ou erreurs détaillées)
    if (depenseResult.success) {
      return sendSuccess(res, depenseResult.message, {
        type: 'depenses',
        result: depenseResult
      });
    } else {
      return res.status(400).json({
        success: false,
        message: depenseResult.message,
        result: depenseResult
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * Import spécifique pour les dépenses 
 */
export const importDepensesCsv = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next(new AppError(COMMON.ERRORS.NO_CSV_FILE, 400));
  if (!req.user) return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
  
  try {
    const csvBuffer = Buffer.from(req.file.buffer);
    const result = await ImportServiceV2.importDepensesFromCSV(csvBuffer, req.user.id);
    
    if (result.success) {
      return sendSuccess(res, result.message, { result });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        result: result
      });
    }  } catch (error) {
    next(error);
  }
};

/**
 * Import spécifique pour les revenus  
 */
export const importRevenusCsv = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next(new AppError(COMMON.ERRORS.NO_CSV_FILE, 400));
  if (!req.user) return next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
  
  try {
    const csvBuffer = Buffer.from(req.file.buffer);
    const result = await ImportServiceV2.importRevenusFromCSV(csvBuffer, req.user.id);
    
    if (result.success) {
      return sendSuccess(res, result.message, { result });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        result: result
      });
    }
    
  } catch (error) {
    next(error);
  }
};
