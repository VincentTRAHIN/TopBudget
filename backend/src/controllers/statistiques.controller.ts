import { Response } from "express";
import mongoose from "mongoose";
import Depense from "../models/depense.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AUTH } from "../constants";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { DEPENSE } from "../constants/depense.constants";

export const totalDepensesMensuelles = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    let { mois, annee } = req.query;
    const contexte = req.query.contexte;
    const { categorie } = req.query;
    if (!mois || !annee) {
      const dateActuelle = new Date();
      mois = format(dateActuelle, "MM");
      annee = format(dateActuelle, "yyyy");
      logger.debug(`Utilisation des valeurs par défaut: mois=${mois}, année=${annee}`);
    }

    // Gestion du contexte (moi/couple)
    const match: Record<string, unknown> = {
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };
    if (categorie) {
      match.categorie = categorie as string;
    }
    if (contexte === 'couple') {
      // Charger le user complet pour avoir le partenaireId
      const User = (await import('../models/user.model')).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = { $in: [
          String(fullCurrentUser._id),
          String(fullCurrentUser.partenaireId)
        ].map(id => new mongoose.Types.ObjectId(id)) };
        // Pour stats couple, on ne filtre pas sur typeDepense ici (total toutes dépenses)
      } else {
        match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
      }
    } else {
      match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
    }

    const depenses = await Depense.find(match);
    const total = depenses.reduce((acc, depense) => acc + depense.montant, 0);

    res.json({
      depenses,
      total,
    });
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors du calcul des dépenses mensuelles" });
  }
};

export const repartitionParCategorie = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { mois, annee } = req.query;
    const contexte = req.query.contexte;
    if (!mois || !annee) {
      res
        .status(400)
        .json({ message: "Les paramètres mois et année sont requis" });
      return;
    }
    // Gestion du contexte (moi/couple)
    const match: Record<string, unknown> = {
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };
    if (contexte === 'couple') {
      const User = (await import('../models/user.model')).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = { $in: [
          String(fullCurrentUser._id),
          String(fullCurrentUser.partenaireId)
        ].map(id => new mongoose.Types.ObjectId(id)) };
        match.typeDepense = DEPENSE.TYPES_DEPENSE.COMMUNE; // Pour stats couple, on ne veut que les communes
      } else {
        match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
      }
    } else {
      match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
    }

    const depenses = await Depense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$categorie",
          total: { $sum: "$montant" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categorieDetails"
        }
      },
      {
        $unwind: {
          path: "$categorieDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          nom: "$categorieDetails.nom" 
        }
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json(depenses);
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({
        message: "Erreur lors du calcul de la répartition par catégorie",
      });
  }
};

export const comparaisonMois = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { contexte } = req.query;
    // userIds peut être un ObjectId ou un filtre $in
    let userIds: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } = new mongoose.Types.ObjectId(req.user.id);
    if (contexte === 'couple') {
      const User = (await import('../models/user.model')).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        userIds = { $in: [
          String(fullCurrentUser._id),
          String(fullCurrentUser.partenaireId)
        ].map(id => new mongoose.Types.ObjectId(id)) };
      }
    }

    let dateQueryActuelle: Date;
    let dateQueryPrecedente: Date;
    const {
      moisActuel: moisActuelQuery,
      anneeActuelle: anneeActuelleQuery,
      moisPrecedent: moisPrecedentQuery,
      anneePrecedente: anneePrecedenteQuery,
    } = req.query;

    if (
      moisActuelQuery &&
      anneeActuelleQuery &&
      moisPrecedentQuery &&
      anneePrecedenteQuery
    ) {
      const mA = parseInt(moisActuelQuery as string, 10);
      const aA = parseInt(anneeActuelleQuery as string, 10);
      const mP = parseInt(moisPrecedentQuery as string, 10);
      const aP = parseInt(anneePrecedenteQuery as string, 10);

      dateQueryActuelle = new Date(aA, mA - 1, 1);
      dateQueryPrecedente = new Date(aP, mP - 1, 1);
    } else {
      dateQueryActuelle = new Date();
      dateQueryPrecedente = subMonths(dateQueryActuelle, 1);
    }

    const debutMoisActuel = startOfMonth(dateQueryActuelle);
    const finMoisActuel = endOfMonth(dateQueryActuelle);
    const debutMoisPrecedent = startOfMonth(dateQueryPrecedente);
    const finMoisPrecedent = endOfMonth(dateQueryPrecedente);

    const depensesActuelles = await Depense.aggregate([
      {
        $match: {
          utilisateur: userIds,
          date: {
            $gte: debutMoisActuel,
            $lte: finMoisActuel,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" },
        },
      },
    ]);

    const depensesPassees = await Depense.aggregate([
      {
        $match: {
          utilisateur: userIds,
          date: {
            $gte: debutMoisPrecedent,
            $lte: finMoisPrecedent,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" },
        },
      },
    ]);

    const totalMoisActuel = depensesActuelles[0]?.total || 0;
    const totalMoisPrecedent = depensesPassees[0]?.total || 0;
    const difference = totalMoisActuel - totalMoisPrecedent;
    const pourcentageVariation =
      totalMoisPrecedent !== 0
        ? (difference / totalMoisPrecedent) * 100
        : totalMoisActuel > 0
        ? Infinity
        : 0;

    res.json({
      totalMoisActuel,
      totalMoisPrecedent,
      difference,
      pourcentageVariation,
    });
  } catch (error) {
    logger.error("Erreur lors de la comparaison des mois:", error);
    res.status(500).json({ message: "Erreur lors de la comparaison des mois" });
  }
};

export const getEvolutionDepensesMensuelles = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const nbMoisQuery = req.query.nbMois as string | undefined;
    let nbMois = 6;
    const { contexte } = req.query;
    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        res
          .status(400)
          .json({
            message: "Le paramètre nbMois doit être un nombre entre 1 et 24.",
          });
        return;
      }
    }

    const dateActuelle = new Date();
    const dateFin = endOfMonth(dateActuelle);
    const dateDebut = startOfMonth(subMonths(dateActuelle, nbMois - 1));

    const match: Record<string, unknown> = {
      date: {
        $gte: dateDebut,
        $lte: dateFin,
      },
    };
    if (contexte === 'couple') {
      const User = (await import('../models/user.model')).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = { $in: [
          String(fullCurrentUser._id),
          String(fullCurrentUser.partenaireId)
        ].map(id => new mongoose.Types.ObjectId(id)) };
        match.typeDepense = DEPENSE.TYPES_DEPENSE.COMMUNE; // Pour stats couple, on ne veut que les communes
      } else {
        match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
      }
    } else {
      match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
    }

    const aggregatedResults = await Depense.aggregate([
      { $match: match },
      {
        $project: {
          annee: { $year: "$date" },
          mois: { $month: "$date" },
          montant: "$montant",
        },
      },
      {
        $group: {
          _id: { annee: "$annee", mois: "$mois" },
          totalDepenses: { $sum: "$montant" },
        },
      },
      {
        $sort: { "_id.annee": 1, "_id.mois": 1 },
      },
      {
        $project: {
          _id: 0,
          mois: {
            $concat: [
              { $toString: "$_id.annee" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.mois", 10] },
                  then: { $concat: ["0", { $toString: "$_id.mois" }] },
                  else: { $toString: "$_id.mois" },
                },
              },
            ],
          },
          totalDepenses: "$totalDepenses",
        },
      },
    ]);
    console.log('DEBUG evolution-mensuelle:', JSON.stringify(aggregatedResults, null, 2));

    const finalResults = [];
    const monthsInInterval = eachMonthOfInterval({
      start: dateDebut,
      end: dateFin,
    });

    for (const month of monthsInInterval) {
      const formattedMonth = format(month, "yyyy-MM");
      const existingEntry = aggregatedResults.find(
        (entry) => entry.mois === formattedMonth
      );

      if (existingEntry) {
        finalResults.push(existingEntry);
      } else {
        finalResults.push({ mois: formattedMonth, totalDepenses: 0 });
      }
    }

    res.json(finalResults);
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération de l'évolution des dépenses mensuelles: ${error}`
    );
    res
      .status(500)
      .json({
        message:
          "Erreur lors de la récupération de l'évolution des dépenses mensuelles",
      });
  }
};
