import mongoose from 'mongoose';
import User from '../models/user.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendErrorClient } from './response.utils';
import { Response } from 'express';
import { AUTH } from '../constants';

export type UserIdsType = mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };

/**
 * Récupère l'ID de l'utilisateur ou les IDs du couple selon le contexte
 * @param req Requête authentifiée
 * @param res Réponse Express
 * @param contexte Contexte de la requête ("couple" ou undefined)
 * @returns Un objet contenant les IDs utilisateurs ou null en cas d'erreur
 */
export async function getUserIdsFromContext(
  req: AuthRequest,
  res: Response,
  contexte?: string
): Promise<{ userIds: UserIdsType, utilisateurFilter: UserIdsType } | null> {
  if (!req.user) {
    sendErrorClient(res, AUTH.ERRORS.UNAUTHORIZED);
    return null;
  }
  
  let userIds: UserIdsType = new mongoose.Types.ObjectId(req.user.id);
  let utilisateurFilter: UserIdsType = userIds;
  
  if (contexte === "couple") {
    const fullCurrentUser = await User.findById(req.user.id);
    if (fullCurrentUser && fullCurrentUser.partenaireId) {
      utilisateurFilter = {
        $in: [
          new mongoose.Types.ObjectId(String(fullCurrentUser._id)),
          new mongoose.Types.ObjectId(String(fullCurrentUser.partenaireId)),
        ],
      };
      userIds = utilisateurFilter;
    }
  }
  
  return { userIds, utilisateurFilter };
}
