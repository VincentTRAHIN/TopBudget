/**
 * Extension des types d'Express pour permettre l'utilisation de handlers asynchrones
 * dans les routes Express.
 * 
 * Ce fichier permet de corriger les erreurs de typage liées aux fonctions asynchrones
 * qui renvoient des Promises dans les middlewares et les routes d'Express.
 */

import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

declare module 'express-serve-static-core' {
  /**
   * Extension de l'interface RequestHandler pour supporter les retours de type Promise.
   * 
   * Par défaut, Express attend des fonctions qui retournent soit void, soit Promise<void>.
   * Cette extension permet de retourner également:
   * - Response - pour le chaînage de méthodes avec res.status().json(), etc.
   * - Promise<unknown> - pour les gestionnaires asynchrones
   * - Promise<Response> - pour les gestionnaires asynchrones avec chaînage
   * 
   * @template P Type des paramètres de route (req.params)
   * @template ResBody Type du corps de la réponse
   * @template ReqBody Type du corps de la requête (req.body)
   * @template ReqQuery Type des paramètres de la requête (req.query)
   * @template Locals Type des variables locales
   */
  export interface RequestHandler<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
  > {
    (
      req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
      res: Response<ResBody, Locals>,
      next: NextFunction
    ): void | Response | Promise<void | Response | unknown>;
  }
} 