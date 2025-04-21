import { Response } from 'express';
import Depense from '../models/depense.model';
import { validationResult } from 'express-validator';
import logger from '../utils/logger.utils';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DEPENSE, AUTH } from '../constants';

export const ajouterDepense = async (req: AuthRequest, res: Response): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    res.status(400).json({ erreurs: erreurs.array() });
    return;
  }

  try {
    const { montant, date, commentaire, typeCompte, recurrence, categorie } = req.body;

    // Validation du montant
    if (montant < DEPENSE.VALIDATION.MIN_MONTANT || montant > DEPENSE.VALIDATION.MAX_MONTANT) {
      res.status(400).json({ message: DEPENSE.ERROR_MESSAGES.INVALID_MONTANT });
      return;
    }

    // Validation du type de compte
    if (!Object.values(DEPENSE.TYPES_COMPTE).includes(typeCompte)) {
      res.status(400).json({ message: DEPENSE.ERROR_MESSAGES.INVALID_TYPE_COMPTE });
      return;
    }

    const nouvelleDepense = await Depense.create({
      montant,
      date,
      commentaire,
      typeCompte,
      recurrence,
      categorie,
      utilisateur: req.user ? req.user.id : null,
    });

    res.status(201).json(nouvelleDepense);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de l'ajout de la dépense" });
  }
};

export const obtenirDepenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || DEPENSE.PAGINATION.DEFAULT_LIMIT,
      DEPENSE.PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    const depenses = await Depense.find({ utilisateur: req.user.id })
      .populate('categorie')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Depense.countDocuments({ utilisateur: req.user.id });

    res.json({
      depenses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des dépenses" });
  }
};

export const modifierDepense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const depense = await Depense.findById(req.params.id);

    if (!depense) {
      res.status(404).json({ message: DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND });
      return;
    }

    if (!req.user || depense.utilisateur.toString() !== req.user.id.toString()) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const updated = await Depense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la dépense" });
  }
};

export const supprimerDepense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const depense = await Depense.findById(req.params.id);

    if (!depense) {
      res.status(404).json({ message: DEPENSE.ERROR_MESSAGES.DEPENSE_NOT_FOUND });
      return;
    }

    if (!req.user || depense.utilisateur.toString() !== req.user.id.toString()) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    await depense.deleteOne();
    res.json({ message: 'Dépense supprimée' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la dépense" });
  }
};
