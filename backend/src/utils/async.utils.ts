import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { TypedAuthRequest, AsyncController } from "../types/typed-request";
import { ParamsDictionary } from "express-serve-static-core";
import { Query } from "express-serve-static-core";

/**
 * Wrapper générique pour gérer les controllers asynchrones et les erreurs
 * @param fn Fonction contrôleur asynchrone
 * @returns Fonction contrôleur avec gestion d'erreur
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void | unknown>
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Version spécifique du wrapper pour les contrôleurs authentifiés
 */
export const asyncAuthHandler = (
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | unknown>
) => {
  return asyncHandler<AuthRequest>(fn);
};

/**
 * Wrapper typé pour les contrôleurs avec authentification et gestion des erreurs
 */
export function createAsyncHandler<
  Body = unknown, 
  Params extends ParamsDictionary = ParamsDictionary, 
  QueryParams extends Query = Query
>(handler: AsyncController<Body, Params, QueryParams>) {
  return (req: TypedAuthRequest<Body, Params, QueryParams>, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
