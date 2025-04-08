import express from 'express';
import { body } from 'express-validator';
import { inscription, connexion } from '../controllers/auth.controller';

const router = express.Router();

router.post(
  '/register',
  [
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Un email valide est requis'),
    body('motDePasse').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
  inscription
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Un email valide est requis'),
    body('motDePasse').exists().withMessage('Le mot de passe est requis'),
  ],
  connexion
);

export default router;
