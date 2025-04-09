import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import logger from '../utils/logger.utils';

export interface AuthRequest extends Request {
  user?: { id: string; name: string; email: string }; 
}

export const proteger = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      const user = await User.findById(decoded.id).select('-motDePasse') as { _id: string; nom: string; email: string } | null;
      if (user) {
        req.user = { id: user._id.toString(), name: user.nom, email: user.email };
      } else {
         res.status(404).json({ message: 'Utilisateur non trouvé' });
         return;
      }
      next();
    } catch (error) {
      logger.error(error);
      res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Non autorisé, aucun token' });
  }
};
