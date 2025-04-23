import { Response } from 'express';
import Depense from '../models/depense.model';
import logger from '../utils/logger.utils';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AUTH } from '../constants';

export const totalDepensesMensuelles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { mois, annee, categorie } = req.query;

    const match: { utilisateur: string; date: { $gte: Date; $lte: Date }; categorie?: string } = {
      utilisateur: req.user.id,
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`)
      }
    };

    if (categorie) {
      match.categorie = categorie as string;
    }

    const depenses = await Depense.find(match);
    const total = depenses.reduce((acc, depense) => acc + depense.montant, 0);

    res.json({
      depenses,
      total
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors du calcul des dépenses mensuelles" });
  }
};

export const repartitionParCategorie = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { mois, annee } = req.query;

    if (!mois || !annee) {
      res.status(400).json({ message: "Les paramètres mois et année sont requis" });
      return;
    }

    const depenses = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user.id,
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
      },
      {
        $sort: { total: -1 }
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
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { moisActuel, moisPrecedent, anneeActuelle, anneePrecedente } = req.query;

    if (!moisActuel || !moisPrecedent || !anneeActuelle || !anneePrecedente) {
      res.status(400).json({ message: "Tous les paramètres sont requis pour la comparaison" });
      return;
    }

    const depensesActuelles = await Depense.aggregate([
      {
        $match: {
          utilisateur: req.user.id,
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
          utilisateur: req.user.id,
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
      moisPrecedent: depensesPassees[0]?.total || 0,
      difference: (depensesActuelles[0]?.total || 0) - (depensesPassees[0]?.total || 0),
      pourcentage: depensesPassees[0]?.total ? 
        (((depensesActuelles[0]?.total || 0) - (depensesPassees[0]?.total || 0)) / depensesPassees[0]?.total) * 100 : 0
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Erreur lors de la comparaison des mois" });
  }
};
