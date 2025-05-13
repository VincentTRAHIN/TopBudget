import { Response } from "express";
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
import mongoose from "mongoose";

export const totalDepensesMensuelles = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { mois, annee, categorie } = req.query;

    const match: {
      utilisateur: string;
      date: { $gte: Date; $lte: Date };
      categorie?: string;
    } = {
      utilisateur: req.user.id,
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };

    if (categorie) {
      match.categorie = categorie as string;
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

    if (!mois || !annee) {
      res
        .status(400)
        .json({ message: "Les paramètres mois et année sont requis" });
      return;
    }

    const depenses = await Depense.aggregate([
      {
        $match: {
          utilisateur: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: new Date(`${annee}-${mois}-01`),
            $lte: new Date(`${annee}-${mois}-31`),
          },
        },
      },
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

    const userId = new mongoose.Types.ObjectId(req.user.id);
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

    logger.debug(`Utilisateur ID: ${userId}`);
    logger.debug(
      `Période actuelle: ${format(debutMoisActuel, "yyyy-MM-dd")} à ${format(
        finMoisActuel,
        "yyyy-MM-dd"
      )}`
    );
    logger.debug(
      `Période précédente: ${format(
        debutMoisPrecedent,
        "yyyy-MM-dd"
      )} à ${format(finMoisPrecedent, "yyyy-MM-dd")}`
    );

    const depensesActuelles = await Depense.aggregate([
      {
        $match: {
          utilisateur: userId,
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
          utilisateur: userId,
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

    logger.debug(
      `Total Actuel: ${totalMoisActuel}, Total Précédent: ${totalMoisPrecedent}, Diff: ${difference}, %Var: ${pourcentageVariation}`
    );

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

    const userId = req.user.id;
    logger.debug(`Utilisateur ID (string): ${userId}`);
    logger.debug(
      `Calcul dateDebut: ${dateDebut.toISOString()}, dateFin: ${dateFin.toISOString()} pour nbMois: ${nbMois}`
    );

    const aggregatedResults = await Depense.aggregate([
      {
        $match: {
          utilisateur: new mongoose.Types.ObjectId(userId),
          date: {
            $gte: dateDebut,
            $lte: dateFin,
          },
        },
      },
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
    logger.debug(
      `Résultat brut de l'agrégation: ${JSON.stringify(aggregatedResults)}`
    );

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
