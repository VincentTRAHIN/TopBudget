import {  Response } from 'express';
import Depense from '../models/depense.model';
import { validationResult } from 'express-validator';
import logger from '../utils/logger.utils';
import { AuthRequest } from '../middlewares/auth.middleware';

export const ajouterDepense = async (req: AuthRequest, res: Response): Promise<void> => {
  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
     res.status(400).json({ erreurs: erreurs.array() });
     return;
  }

  try {
    const { montant, date, commentaire, typeCompte, recurrence, categorie } = req.body;

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
       res.status(401).json({ message: 'Utilisateur non authentifié' });
       return;
    }
    const depenses = await Depense.find({ utilisateur: req.user.id }).populate('categorie');
    res.json(depenses);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des dépenses" });
  }
};

export const modifierDepense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const depense = await Depense.findById(req.params.id);

    if (!depense) {
       res.status(404).json({ message: 'Dépense non trouvée' });
       return;
    }

    if (!req.user || depense.utilisateur.toString() !== req.user.id.toString()) {
       res.status(401).json({ message: 'Non autorisé' });
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
       res.status(404).json({ message: 'Dépense non trouvée' });
       return;
    }

    if (!req.user || depense.utilisateur.toString() !== req.user.id.toString()) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }

    await depense.deleteOne();
    res.json({ message: 'Dépense supprimée' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la dépense" });
  }
};
