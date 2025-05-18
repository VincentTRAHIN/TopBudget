import { Response, NextFunction } from "express";
import mongoose, { Document, Types } from "mongoose";
import Depense from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { AUTH } from "../constants";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { DEPENSE } from "../constants/depense.constants";
import User from "../models/user.model";
import { IUser } from "../types/user.types";

interface MontantDocument extends Document {
  montant: number;
}

async function _getAggregatedFluxForPeriod<T extends MontantDocument>(
  model: mongoose.Model<T>,
  userIds: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] },
  dateStart: Date,
  dateEnd: Date,
  additionalMatch: Record<string, unknown> = {},
): Promise<number> {
  const result = await model.aggregate([
    {
      $match: {
        utilisateur: userIds,
        date: { $gte: dateStart, $lte: dateEnd },
        ...additionalMatch,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$montant" },
      },
    },
  ]);
  return result[0]?.total || 0;
}

async function _getUserIdsForContext(
  reqUser: { id: string; partenaireId?: string },
  contexte?: string,
): Promise<mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] }> {
  let userIds: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } =
    new mongoose.Types.ObjectId(reqUser.id);
  if (contexte === "couple") {
    const fullCurrentUser = await User.findById(reqUser.id);
    if (fullCurrentUser && fullCurrentUser.partenaireId) {
      userIds = {
        $in: [
          new mongoose.Types.ObjectId(String(fullCurrentUser._id)),
          new mongoose.Types.ObjectId(String(fullCurrentUser.partenaireId)),
        ],
      };
    }
  }
  return userIds;
}

export const totalDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
      logger.debug(
        `Utilisation des valeurs par défaut: mois=${mois}, année=${annee}`,
      );
    }

    const match: Record<string, unknown> = {
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };
    if (categorie) {
      match.categorie = categorie as string;
    }
    if (contexte === "couple") {
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
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
    logger.error("Erreur lors du calcul des dépenses mensuelles:", error);
    next(new AppError("Erreur lors du calcul des dépenses mensuelles", 500));
  }
};

export const repartitionParCategorie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    const match: Record<string, unknown> = {
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };
    if (contexte === "couple") {
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
        match.typeDepense = DEPENSE.TYPES_DEPENSE.COMMUNE;
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
          as: "categorieDetails",
        },
      },
      {
        $unwind: {
          path: "$categorieDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          nom: "$categorieDetails.nom",
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json(depenses);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de la répartition par catégorie:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul de la répartition par catégorie",
        500,
      ),
    );
  }
};

export const getSoldeMensuel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const {
      mois: moisQuery,
      annee: anneeQuery,
      contexte,
    } = req.query as { mois?: string; annee?: string; contexte?: string };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const userIds = await _getUserIdsForContext(
      req.user,
      contexte as string | undefined,
    );

    const totalRevenus = await _getAggregatedFluxForPeriod(
      RevenuModel,
      userIds,
      dateDebutMois,
      dateFinMois,
    );
    const totalDepenses = await _getAggregatedFluxForPeriod(
      Depense,
      userIds,
      dateDebutMois,
      dateFinMois,
    );

    const solde = totalRevenus - totalDepenses;

    res.json({
      mois: format(dateDebutMois, "yyyy-MM"),
      totalRevenus,
      totalDepenses,
      solde,
    });
  } catch (error) {
    logger.error("Erreur lors du calcul du solde mensuel:", error);
    next(new AppError("Erreur lors du calcul du solde mensuel", 500));
  }
};

export const comparaisonMois = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const { contexte, type = "depenses" } = req.query as {
      contexte?: string;
      type?: "depenses" | "revenus" | "solde";
    };
    const userIds = await _getUserIdsForContext(
      req.user,
      contexte as string | undefined,
    );

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

    let totalMoisActuel = 0;
    let totalMoisPrecedent = 0;

    if (type === "depenses") {
      totalMoisActuel = await _getAggregatedFluxForPeriod(
        Depense,
        userIds,
        debutMoisActuel,
        finMoisActuel,
      );
      totalMoisPrecedent = await _getAggregatedFluxForPeriod(
        Depense,
        userIds,
        debutMoisPrecedent,
        finMoisPrecedent,
      );
    } else if (type === "revenus") {
      totalMoisActuel = await _getAggregatedFluxForPeriod(
        RevenuModel,
        userIds,
        debutMoisActuel,
        finMoisActuel,
      );
      totalMoisPrecedent = await _getAggregatedFluxForPeriod(
        RevenuModel,
        userIds,
        debutMoisPrecedent,
        finMoisPrecedent,
      );
    } else if (type === "solde") {
      const depensesActuel = await _getAggregatedFluxForPeriod(
        Depense,
        userIds,
        debutMoisActuel,
        finMoisActuel,
      );
      const revenusActuel = await _getAggregatedFluxForPeriod(
        RevenuModel,
        userIds,
        debutMoisActuel,
        finMoisActuel,
      );
      totalMoisActuel = revenusActuel - depensesActuel;

      const depensesPrecedent = await _getAggregatedFluxForPeriod(
        Depense,
        userIds,
        debutMoisPrecedent,
        finMoisPrecedent,
      );
      const revenusPrecedent = await _getAggregatedFluxForPeriod(
        RevenuModel,
        userIds,
        debutMoisPrecedent,
        finMoisPrecedent,
      );
      totalMoisPrecedent = revenusPrecedent - depensesPrecedent;
    }

    const difference = totalMoisActuel - totalMoisPrecedent;
    const pourcentageVariation =
      totalMoisPrecedent !== 0
        ? (difference / totalMoisPrecedent) * 100
        : totalMoisActuel !== 0
          ? totalMoisActuel > 0
            ? Infinity
            : -Infinity
          : 0;

    res.json({
      typeCompare: type,
      moisActuel: format(debutMoisActuel, "yyyy-MM"),
      moisPrecedent: format(debutMoisPrecedent, "yyyy-MM"),
      totalMoisActuel,
      totalMoisPrecedent,
      difference,
      pourcentageVariation,
    });
  } catch (error) {
    logger.error("Erreur lors de la comparaison des mois:", error);
    next(new AppError("Erreur lors de la comparaison des mois", 500));
  }
};

export const getEvolutionDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
        res.status(400).json({
          message: "Le paramètre nbMois doit être un nombre entre 1 et 24.",
        });
        return;
      }
    }

    const dateActuelle = new Date();

    const userIds = await _getUserIdsForContext(
      req.user,
      contexte as string | undefined,
    );

    const monthsArray = eachMonthOfInterval({
      start: subMonths(dateActuelle, nbMois - 1),
      end: dateActuelle,
    });

    const evolution = await Promise.all(
      monthsArray.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const total = await _getAggregatedFluxForPeriod(
          Depense,
          userIds,
          monthStart,
          monthEnd,
        );
        return {
          mois: format(monthStart, "yyyy-MM"),
          total,
        };
      }),
    );

    res.json(evolution);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de l'évolution des dépenses mensuelles:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul de l'évolution des dépenses mensuelles",
        500,
      ),
    );
  }
};

export const getEvolutionRevenusMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const {
      nbMois: nbMoisQuery,
      contexte,
      estRecurrent,
    } = req.query as {
      nbMois?: string;
      contexte?: string;
      estRecurrent?: string;
    };
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

    const userIds = await _getUserIdsForContext(req.user, contexte);
    const dateActuelle = new Date();
    const monthsArray = eachMonthOfInterval({
      start: subMonths(dateActuelle, nbMois - 1),
      end: dateActuelle,
    });

    const evolution = await Promise.all(
      monthsArray.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const match: Record<string, unknown> = {
          utilisateur: userIds,
          date: { $gte: monthStart, $lte: monthEnd },
        };
        if (typeof estRecurrent !== "undefined") {
          if (Array.isArray(estRecurrent)) {
            match.estRecurrent = estRecurrent[0] === "true";
          } else if (typeof estRecurrent === "string") {
            match.estRecurrent = estRecurrent === "true";
          } else {
            match.estRecurrent = Boolean(estRecurrent);
          }
        }
        const result = await RevenuModel.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: "$montant" } } },
        ]);
        return {
          mois: format(monthStart, "yyyy-MM"),
          total: result[0]?.total || 0,
        };
      }),
    );
    res.json(evolution);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de l'évolution des revenus mensuels:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul de l'évolution des revenus mensuels",
        500,
      ),
    );
  }
};

export const getEvolutionSoldesMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const { nbMois: nbMoisQuery, contexte } = req.query as {
      nbMois?: string;
      contexte?: string;
    };
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

    const userIds = await _getUserIdsForContext(req.user, contexte);
    const dateActuelle = new Date();
    const monthsArray = eachMonthOfInterval({
      start: subMonths(dateActuelle, nbMois - 1),
      end: dateActuelle,
    });

    const evolution = await Promise.all(
      monthsArray.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const totalRevenus = await _getAggregatedFluxForPeriod(
          RevenuModel,
          userIds,
          monthStart,
          monthEnd,
        );
        const totalDepenses = await _getAggregatedFluxForPeriod(
          Depense,
          userIds,
          monthStart,
          monthEnd,
        );
        return {
          mois: format(monthStart, "yyyy-MM"),
          solde: totalRevenus - totalDepenses,
          totalRevenus,
          totalDepenses,
        };
      }),
    );
    res.json(evolution);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de l'évolution des soldes mensuels:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul de l'évolution des soldes mensuels",
        500,
      ),
    );
  }
};

export const getCoupleContributionsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié." });
      return;
    }
    const fullCurrentUser = await User.findById(req.user.id).populate<{
      partenaireId: IUser;
    }>("partenaireId");

    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      res
        .status(401)
        .json({
          message: "Partenaire non défini pour l'utilisateur ou non trouvé.",
        });
      return;
    }

    const { mois: moisQuery, annee: anneeQuery } = req.query as {
      mois?: string;
      annee?: string;
    };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const partner = fullCurrentUser.partenaireId;

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const partnerObjectId = partner._id as mongoose.Types.ObjectId;

    const revenusUser = await _getAggregatedFluxForPeriod(
      RevenuModel,
      userId,
      dateDebutMois,
      dateFinMois,
      { typeCompte: "Perso" },
    );
    const revenusPartner = await _getAggregatedFluxForPeriod(
      RevenuModel,
      partnerObjectId,
      dateDebutMois,
      dateFinMois,
      { typeCompte: "Perso" },
    );

    const depensesPersoUser = await _getAggregatedFluxForPeriod(
      Depense,
      userId,
      dateDebutMois,
      dateFinMois,
      { typeDepense: DEPENSE.TYPES_DEPENSE.PERSO },
    );
    const depensesPersoPartner = await _getAggregatedFluxForPeriod(
      Depense,
      partnerObjectId,
      dateDebutMois,
      dateFinMois,
      { typeDepense: DEPENSE.TYPES_DEPENSE.PERSO },
    );

    const depensesCommunesPayeesParUser = await _getAggregatedFluxForPeriod(
      Depense,
      userId,
      dateDebutMois,
      dateFinMois,
      { typeDepense: DEPENSE.TYPES_DEPENSE.COMMUNE },
    );
    const depensesCommunesPayeesParPartner = await _getAggregatedFluxForPeriod(
      Depense,
      partnerObjectId,
      dateDebutMois,
      dateFinMois,
      { typeDepense: DEPENSE.TYPES_DEPENSE.COMMUNE },
    );

    const totalDepensesCommunes =
      depensesCommunesPayeesParUser + depensesCommunesPayeesParPartner;

    res.json({
      periode: format(dateDebutMois, "yyyy-MM"),
      utilisateurPrincipal: {
        id: req.user.id,
        nom: fullCurrentUser.nom,
        sobriquetPartenaire: fullCurrentUser.sobriquetPartenaire,
        revenusPerso: revenusUser,
        depensesPerso: depensesPersoUser,
        partDepensesCommunesPayees: depensesCommunesPayeesParUser,
      },
      partenaire: {
        id: (partner._id as Types.ObjectId).toString(),
        nom: partner.nom,
        sobriquetPartenaire: partner.sobriquetPartenaire,
        revenusPerso: revenusPartner,
        depensesPerso: depensesPersoPartner,
        partDepensesCommunesPayees: depensesCommunesPayeesParPartner,
      },
      totalDepensesCommunes,
    });
  } catch (error) {
    logger.error(
      "Erreur lors du calcul du résumé des contributions du couple:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul du résumé des contributions du couple",
        500,
      ),
    );
  }
};

export const getCoupleFixedCharges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Utilisateur non authentifié." });
      return;
    }
    const fullCurrentUser = await User.findById(req.user.id);
    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      res
        .status(401)
        .json({ message: "Partenaire non défini pour l'utilisateur." });
      return;
    }

    const { mois: moisQuery, annee: anneeQuery } = req.query as {
      mois?: string;
      annee?: string;
    };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const partnerObjectId = fullCurrentUser.partenaireId;
    const userIds = {
      $in: [new mongoose.Types.ObjectId(req.user.id), partnerObjectId],
    };

    const chargesFixesCommunes = await Depense.find({
      utilisateur: userIds,
      date: { $gte: dateDebutMois, $lte: dateFinMois },
      estChargeFixe: true,
      typeDepense: DEPENSE.TYPES_DEPENSE.COMMUNE,
    }).populate("categorie", "nom");

    const totalChargesFixesCommunes = chargesFixesCommunes.reduce(
      (acc, charge) => acc + charge.montant,
      0,
    );

    const chargesFixesUser = await Depense.find({
      utilisateur: new mongoose.Types.ObjectId(req.user.id),
      date: { $gte: dateDebutMois, $lte: dateFinMois },
      estChargeFixe: true,
    }).populate("categorie", "nom");
    const totalChargesFixesUser = chargesFixesUser.reduce(
      (acc, charge) => acc + charge.montant,
      0,
    );

    const chargesFixesPartner = await Depense.find({
      utilisateur: partnerObjectId,
      date: { $gte: dateDebutMois, $lte: dateFinMois },
      estChargeFixe: true,
    }).populate("categorie", "nom");
    const totalChargesFixesPartner = chargesFixesPartner.reduce(
      (acc, charge) => acc + charge.montant,
      0,
    );

    res.json({
      periode: format(dateDebutMois, "yyyy-MM"),
      chargesFixesCommunes,
      totalChargesFixesCommunes,
      detailsParMembre: {
        utilisateurPrincipal: {
          id: req.user.id,
          chargesFixesPersonnellesEtCommunesPayees: chargesFixesUser,
          totalChargesFixesPersonnellesEtCommunesPayees: totalChargesFixesUser,
        },
        partenaire: {
          id: partnerObjectId.toString(),
          chargesFixesPersonnellesEtCommunesPayees: chargesFixesPartner,
          totalChargesFixesPersonnellesEtCommunesPayees:
            totalChargesFixesPartner,
        },
      },
    });
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération des charges fixes du couple:",
      error,
    );
    next(
      new AppError(
        "Erreur lors de la récupération des charges fixes du couple",
        500,
      ),
    );
  }
};

export const getSyntheseMensuelle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    const {
      mois: moisQuery,
      annee: anneeQuery,
      contexte,
    } = req.query as { mois?: string; annee?: string; contexte?: string };
    const now = new Date();
    const currentMonth = moisQuery
      ? parseInt(moisQuery, 10) - 1
      : now.getMonth();
    const currentYear = anneeQuery
      ? parseInt(anneeQuery, 10)
      : now.getFullYear();

    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));

    const userIds = await _getUserIdsForContext(req.user, contexte);

    const totalRevenus = await _getAggregatedFluxForPeriod(
      RevenuModel,
      userIds,
      dateDebutMois,
      dateFinMois,
    );

    const additionalMatchDepenses: Record<string, unknown> = {};

    const totalDepenses = await _getAggregatedFluxForPeriod(
      Depense,
      userIds,
      dateDebutMois,
      dateFinMois,
      additionalMatchDepenses,
    );

    const solde = totalRevenus - totalDepenses;

    const pourcentageDepense =
      totalRevenus > 0 ? (totalDepenses / totalRevenus) * 100 : 0;

    const matchRepartition: Record<string, unknown> = {
      utilisateur: userIds,
      date: { $gte: dateDebutMois, $lte: dateFinMois },
      ...additionalMatchDepenses,
    };
    const repartitionDepenses = await Depense.aggregate([
      { $match: matchRepartition },
      { $group: { _id: "$categorie", total: { $sum: "$montant" } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categorieDetails",
        },
      },
      {
        $unwind: {
          path: "$categorieDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          categorieId: "$_id",
          nom: "$categorieDetails.nom",
          total: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      periode: format(dateDebutMois, "yyyy-MM"),
      contexte: contexte || "personnel",
      totalRevenus,
      totalDepenses,
      solde,
      pourcentageDepense: parseFloat(pourcentageDepense.toFixed(2)),
      repartitionDepenses,
    });
  } catch (error) {
    logger.error(
      "Erreur lors de la génération de la synthèse mensuelle:",
      error,
    );
    next(
      new AppError(
        "Erreur lors de la génération de la synthèse mensuelle",
        500,
      ),
    );
  }
};

export const repartitionRevenusParCategorie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const { mois, annee, contexte } = req.query;
    if (!mois || !annee) {
      res
        .status(400)
        .json({ message: "Les paramètres mois et année sont requis" });
      return;
    }
    const match: Record<string, unknown> = {
      date: {
        $gte: new Date(`${annee}-${mois}-01`),
        $lte: new Date(`${annee}-${mois}-31`),
      },
    };
    if (contexte === "couple") {
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
      } else {
        match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
      }
    } else {
      match.utilisateur = new mongoose.Types.ObjectId(req.user.id);
    }
    const revenus = await RevenuModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$categorieRevenu",
          total: { $sum: "$montant" },
        },
      },
      {
        $lookup: {
          from: "categorierevenus",
          localField: "_id",
          foreignField: "_id",
          as: "categorieDetails",
        },
      },
      {
        $unwind: {
          path: "$categorieDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          nom: "$categorieDetails.nom",
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);
    res.json(revenus);
  } catch (error) {
    logger.error(
      "Erreur lors du calcul de la répartition des revenus par catégorie:",
      error,
    );
    next(
      new AppError(
        "Erreur lors du calcul de la répartition des revenus par catégorie",
        500,
      ),
    );
  }
};
