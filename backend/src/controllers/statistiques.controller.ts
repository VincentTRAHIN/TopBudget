import {  Response } from 'express';
import Depense from '../models/depense.model';
import logger from '../utils/logger.utils';
import { AuthRequest } from '../middlewares/auth.middleware';

export const totalDepensesMensuelles = async (req: AuthRequest, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const depenses = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user?.id,
          date: {
            $gte: new Date(`${annee}-${mois}-01`),
            $lte: new Date(`${annee}-${mois}-31`)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" }
        }
      }
    ]);

    res.json(depenses[0] || { total: 0 });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors du calcul des dépenses mensuelles" });
  }
};

export const repartitionParCategorie = async (req: AuthRequest, res: Response) => {
  try {
    const { mois, annee } = req.query;

    const depenses = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user?.id,
          date: {
            $gte: new Date(`${annee}-${mois}-01`),
            $lte: new Date(`${annee}-${mois}-31`)
          }
        }
      },
      {
        $group: {
          _id: "$categorie",
          total: { $sum: "$montant" }
        }
      }
    ]);

    res.json(depenses);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors du calcul de la répartition par catégorie" });
  }
};

export const comparaisonMois = async (req: AuthRequest, res: Response) => {
  try {
    const { moisActuel, moisPrecedent, anneeActuelle, anneePrecedente } = req.query;

    const depensesActuelles = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user?.id,
          date: {
            $gte: new Date(`${anneeActuelle}-${moisActuel}-01`),
            $lte: new Date(`${anneeActuelle}-${moisActuel}-31`)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" }
        }
      }
    ]);

    const depensesPassees = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user?.id,
          date: {
            $gte: new Date(`${anneePrecedente}-${moisPrecedent}-01`),
            $lte: new Date(`${anneePrecedente}-${moisPrecedent}-31`)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" }
        }
      }
    ]);

    res.json({
      moisActuel: depensesActuelles[0]?.total || 0,
      moisPrecedent: depensesPassees[0]?.total || 0
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la comparaison des mois" });
  }
};
