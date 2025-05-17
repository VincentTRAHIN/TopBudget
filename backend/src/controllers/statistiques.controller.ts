import { Response, NextFunction } from "express";
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
  res: Response,
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
      logger.debug(
        `Utilisation des valeurs par défaut: mois=${mois}, année=${annee}`,
      );
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
    if (contexte === "couple") {
      // Charger le user complet pour avoir le partenaireId
      const User = (await import("../models/user.model")).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
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
  res: Response,
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
    if (contexte === "couple") {
      const User = (await import("../models/user.model")).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        match.utilisateur = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
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
    logger.error(error);
    res.status(500).json({
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
    let userIds: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } =
      new mongoose.Types.ObjectId(req.user.id);
    if (contexte === "couple") {
      const User = (await import("../models/user.model")).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        userIds = {
          $in: [
            String(fullCurrentUser._id),
            String(fullCurrentUser.partenaireId),
          ].map((id) => new mongoose.Types.ObjectId(id)),
        };
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
  res: Response,
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
        res.status(400).json({
          message: "Le paramètre nbMois doit être un nombre entre 1 et 24.",
        });
        return;
      }
    }

    const dateActuelle = new Date();
    const dateFin = endOfMonth(dateActuelle);
    const dateDebut = startOfMonth(subMonths(dateActuelle, nbMois - 1));

    if (contexte === "couple") {
      const User = (await import("../models/user.model")).default;
      const fullCurrentUser = await User.findById(req.user.id);
      if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
        res.status(400).json({ message: "Aucun partenaire lié." });
        return;
      }
      // Correction ObjectId : utilise toString() pour garantir la compatibilité
      const currentUserObjectId =
        typeof fullCurrentUser._id === "string"
          ? new mongoose.Types.ObjectId(fullCurrentUser._id)
          : fullCurrentUser._id;
      const partenaireObjectId =
        typeof fullCurrentUser.partenaireId === "string"
          ? new mongoose.Types.ObjectId(fullCurrentUser.partenaireId)
          : fullCurrentUser.partenaireId;

      // Pipeline pour barres empilées : perso A, perso B, communes
      const pipeline: mongoose.PipelineStage[] = [
        {
          $match: {
            utilisateur: { $in: [currentUserObjectId, partenaireObjectId] },
            date: { $gte: dateDebut, $lte: dateFin },
          },
        },
        {
          $project: {
            annee: { $year: "$date" },
            mois: { $month: "$date" },
            montant: "$montant",
            typeDepense: "$typeDepense",
            utilisateur: "$utilisateur",
          },
        },
        {
          $group: {
            _id: {
              annee: "$annee",
              mois: "$mois",
              typeDepense: "$typeDepense",
              payeur: "$utilisateur",
            },
            totalParTypeEtPayeur: { $sum: "$montant" },
          },
        },
        {
          $group: {
            _id: { annee: "$_id.annee", mois: "$_id.mois" },
            depensesPersoUserA: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$_id.typeDepense", "Perso"] },
                      { $eq: ["$_id.payeur", currentUserObjectId] },
                    ],
                  },
                  "$totalParTypeEtPayeur",
                  0,
                ],
              },
            },
            depensesPersoUserB: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$_id.typeDepense", "Perso"] },
                      { $eq: ["$_id.payeur", partenaireObjectId] },
                    ],
                  },
                  "$totalParTypeEtPayeur",
                  0,
                ],
              },
            },
            depensesCommunes: {
              $sum: {
                $cond: [
                  { $eq: ["$_id.typeDepense", "Commune"] },
                  "$totalParTypeEtPayeur",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { "_id.annee": 1, "_id.mois": 1 } },
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
            depensesPersoUserA: 1,
            depensesPersoUserB: 1,
            depensesCommunes: 1,
          },
        },
      ];

      const aggregatedResults = await Depense.aggregate(pipeline);
      // Générer la liste complète des mois de la période
      const monthsInInterval = eachMonthOfInterval({
        start: dateDebut,
        end: dateFin,
      });
      const finalResults = monthsInInterval.map((month) => {
        const formattedMonth = format(month, "yyyy-MM");
        const found = aggregatedResults.find((e) => e.mois === formattedMonth);
        return (
          found || {
            mois: formattedMonth,
            depensesPersoUserA: 0,
            depensesPersoUserB: 0,
            depensesCommunes: 0,
          }
        );
      });
      res.json(finalResults);
      return;
    }

    // Cas classique (hors couple)
    const match: Record<string, unknown> = {
      date: {
        $gte: dateDebut,
        $lte: dateFin,
      },
      utilisateur: new mongoose.Types.ObjectId(req.user.id),
    };
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
    // Générer la liste complète des mois de la période
    const monthsInInterval = eachMonthOfInterval({
      start: dateDebut,
      end: dateFin,
    });
    const finalResults = monthsInInterval.map((month) => {
      const formattedMonth = format(month, "yyyy-MM");
      const found = aggregatedResults.find((e) => e.mois === formattedMonth);
      return found || { mois: formattedMonth, totalDepenses: 0 };
    });
    res.json(finalResults);
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération de l'évolution des dépenses mensuelles: ${error}`,
    );
    res.status(500).json({
      message:
        "Erreur lors de la récupération de l'évolution des dépenses mensuelles",
    });
  }
};

export const getCoupleContributionsSummary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    // Récupérer l'utilisateur et le partenaire
    const User = (await import("../models/user.model")).default;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.partenaireId) {
      res.status(400).json({ message: "Aucun partenaire lié." });
      return;
    }
    // Correction typage ObjectId robuste
    const currentUserId = new mongoose.Types.ObjectId(String(currentUser._id));
    const partenaireId = new mongoose.Types.ObjectId(
      String(currentUser.partenaireId),
    );

    // Récupérer mois/annee
    let { mois, annee } = req.query;
    const now = new Date();
    if (!mois || typeof mois !== "string") {
      mois = (now.getMonth() + 1).toString().padStart(2, "0");
    }
    if (!annee || typeof annee !== "string") {
      annee = now.getFullYear().toString();
    }
    const dateDebutMois = new Date(`${annee}-${mois}-01T00:00:00.000Z`);
    const dateFinMois = new Date(`${annee}-${mois}-31T23:59:59.999Z`);

    // Pipeline d'agrégation
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          utilisateur: { $in: [currentUserId, partenaireId] },
          typeDepense: DEPENSE.TYPES_DEPENSE.COMMUNE,
          date: { $gte: dateDebutMois, $lte: dateFinMois },
        },
      },
      {
        $group: {
          _id: "$utilisateur",
          totalPayeParUtilisateur: { $sum: "$montant" },
        },
      },
    ];
    const aggregation = await Depense.aggregate(pipeline);
    // Extraction des totaux
    let payeParMoiPourCommunes = 0;
    let payeParPartenairePourCommunes = 0;
    for (const entry of aggregation) {
      if (entry._id.toString() === currentUserId.toString()) {
        payeParMoiPourCommunes = entry.totalPayeParUtilisateur;
      } else if (entry._id.toString() === partenaireId.toString()) {
        payeParPartenairePourCommunes = entry.totalPayeParUtilisateur;
      }
    }
    const totalDepensesCommunes =
      payeParMoiPourCommunes + payeParPartenairePourCommunes;
    const partTheorique = totalDepensesCommunes / 2;
    const ecartUtilisateurActuel = payeParMoiPourCommunes - partTheorique;
    res.json({
      totalDepensesCommunes,
      contributionUtilisateurActuel: payeParMoiPourCommunes,
      contributionPartenaire: payeParPartenairePourCommunes,
      ecartUtilisateurActuel,
    });
  } catch (error) {
    logger.error("Erreur dans getCoupleContributionsSummary:", error);
    res.status(500).json({
      message: "Erreur lors du calcul du résumé des contributions du couple.",
    });
  }
};

export const getCoupleFixedCharges = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    // Récupérer l'utilisateur et le partenaire
    const User = (await import("../models/user.model")).default;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !currentUser.partenaireId) {
      res.status(400).json({ message: "Aucun partenaire lié." });
      return;
    }
    const currentUserId = new mongoose.Types.ObjectId(String(currentUser._id));
    const partenaireId = new mongoose.Types.ObjectId(
      String(currentUser.partenaireId),
    );

    // Récupérer mois/annee
    let { mois, annee } = req.query;
    const now = new Date();
    if (!mois || typeof mois !== "string") {
      mois = (now.getMonth() + 1).toString().padStart(2, "0");
    }
    if (!annee || typeof annee !== "string") {
      annee = now.getFullYear().toString();
    }
    const dateDebutMois = new Date(`${annee}-${mois}-01T00:00:00.000Z`);
    const dateFinMois = new Date(`${annee}-${mois}-31T23:59:59.999Z`);

    // Pipeline d'agrégation
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          utilisateur: { $in: [currentUserId, partenaireId] },
          typeDepense: DEPENSE.TYPES_DEPENSE.COMMUNE,
          estChargeFixe: true,
          date: { $gte: dateDebutMois, $lte: dateFinMois },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categorie",
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
        $lookup: {
          from: "users",
          localField: "utilisateur",
          foreignField: "_id",
          as: "payeurDetails",
        },
      },
      { $unwind: { path: "$payeurDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          montant: 1,
          categorieNom: "$categorieDetails.nom",
          payePar: "$payeurDetails.nom",
          description: 1,
          date: 1,
        },
      },
    ];
    const listeChargesFixes = await Depense.aggregate(pipeline);
    const totalChargesFixesCommunes = listeChargesFixes.reduce(
      (sum, charge) => sum + (charge.montant || 0),
      0,
    );
    res.json({ listeChargesFixes, totalChargesFixesCommunes });
  } catch (error) {
    logger.error("Erreur dans getCoupleFixedCharges:", error);
    res.status(500).json({
      message:
        "Erreur lors de la récupération des charges fixes communes du couple.",
    });
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
      mois,
      annee,
      contexte: contexteQuery,
    } = req.query as { mois?: string; annee?: string; contexte?: string };
    let contexte = contexteQuery || "moi";
    const now = new Date();
    const moisNum = mois ? parseInt(mois, 10) : now.getMonth() + 1;
    const anneeNum = annee ? parseInt(annee, 10) : now.getFullYear();
    const moisStr = moisNum.toString().padStart(2, "0");
    const anneeStr = anneeNum.toString();
    const dateDebutMois = new Date(`${anneeStr}-${moisStr}-01T00:00:00.000Z`);
    const dateFinMois = endOfMonth(dateDebutMois);
    const dateDebutMoisPrec = subMonths(dateDebutMois, 1);
    const dateFinMoisPrec = endOfMonth(dateDebutMoisPrec);

    // Récupération des utilisateurs
    const User = (await import("../models/user.model")).default;
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    let partenaire: typeof currentUser | null = null;
    let userIds: mongoose.Types.ObjectId[] = [
      new mongoose.Types.ObjectId(String(currentUser._id)),
    ];
    if (contexte === "couple" && currentUser.partenaireId) {
      partenaire = await User.findById(currentUser.partenaireId);
      if (partenaire) {
        userIds = [
          new mongoose.Types.ObjectId(String(currentUser._id)),
          new mongoose.Types.ObjectId(String(partenaire._id)),
        ];
      } else {
        contexte = "moi"; // fallback
      }
    }

    // Utilitaire pour agréger par catégorie avec lookup pour nom
    async function getTotalsByCategorie(
      userIds: mongoose.Types.ObjectId[],
      dateStart: Date,
      dateEnd: Date,
      typeDepenseFilter?: string,
    ) {
      const match: Record<string, unknown> = {
        utilisateur: { $in: userIds },
        date: { $gte: dateStart, $lte: dateEnd },
      };
      if (typeDepenseFilter) match.typeDepense = typeDepenseFilter;
      return await Depense.aggregate([
        { $match: match },
        { $group: { _id: "$categorie", total: { $sum: "$montant" } } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "cat",
          },
        },
        { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
        { $project: { categorieId: "$_id", nom: "$cat.nom", total: 1 } },
      ]);
    }

    // Dépenses du mois sélectionné
    const depensesMois = await Depense.find({
      utilisateur: { $in: userIds },
      date: { $gte: dateDebutMois, $lte: dateFinMois },
    }).lean();

    if (contexte === "moi") {
      const currentUserIdStr = String(currentUser._id);
      const totalDepensesPersonnellesMoi = depensesMois
        .filter(
          (d) =>
            d.typeDepense === DEPENSE.TYPES_DEPENSE.PERSO &&
            String(d.utilisateur) === currentUserIdStr,
        )
        .reduce((sum, d) => sum + d.montant, 0);
      const totalDepensesCommunesPayeesParMoi = depensesMois
        .filter(
          (d) =>
            d.typeDepense === DEPENSE.TYPES_DEPENSE.COMMUNE &&
            String(d.utilisateur) === currentUserIdStr,
        )
        .reduce((sum, d) => sum + d.montant, 0);
      // Catégories en hausse (perso + communes de l'utilisateur)
      const categoriesActuel = await getTotalsByCategorie(
        userIds,
        dateDebutMois,
        dateFinMois,
      );
      const categoriesPrec = await getTotalsByCategorie(
        userIds,
        dateDebutMoisPrec,
        dateFinMoisPrec,
      );
      const categoriesPrecMap = Object.fromEntries(
        categoriesPrec.map((c) => [String(c.categorieId), c]),
      );
      const categoriesEnHausse = categoriesActuel
        .map((cat) => {
          const precedent =
            categoriesPrecMap[String(cat.categorieId)]?.total || 0;
          const variation =
            precedent === 0 ? 100 : ((cat.total - precedent) / precedent) * 100;
          return {
            categorieId: cat.categorieId,
            nom: cat.nom || String(cat.categorieId),
            totalMoisActuel: cat.total,
            totalMoisPrecedent: precedent,
            variationPourcent: variation,
            variationValeur: cat.total - precedent,
          };
        })
        .filter(
          (cat) => cat.variationPourcent > 20 && cat.variationValeur > 10,
        );
      res.json({
        totaux: {
          personnelles: totalDepensesPersonnellesMoi,
          communesPayeesParMoi: totalDepensesCommunesPayeesParMoi,
        },
        categoriesEnHausse,
      });
      return;
    }
    // contexte === 'couple'
    if (!partenaire) {
      res.status(400).json({ message: "Aucun partenaire lié." });
      return;
    }
    const currentUserIdStr = String(currentUser._id);
    const partenaireIdStr = String(partenaire._id);
    const totalDepensesPersonnellesMoi = depensesMois
      .filter(
        (d) =>
          d.typeDepense === DEPENSE.TYPES_DEPENSE.PERSO &&
          String(d.utilisateur) === currentUserIdStr,
      )
      .reduce((sum, d) => sum + d.montant, 0);
    const totalDepensesPersonnellesPartenaire = depensesMois
      .filter(
        (d) =>
          d.typeDepense === DEPENSE.TYPES_DEPENSE.PERSO &&
          String(d.utilisateur) === partenaireIdStr,
      )
      .reduce((sum, d) => sum + d.montant, 0);
    const totalDepensesCommunesCouple = depensesMois
      .filter((d) => d.typeDepense === DEPENSE.TYPES_DEPENSE.COMMUNE)
      .reduce((sum, d) => sum + d.montant, 0);
    // Catégories en hausse (uniquement communes pour le couple)
    const categoriesActuel = await getTotalsByCategorie(
      userIds,
      dateDebutMois,
      dateFinMois,
      DEPENSE.TYPES_DEPENSE.COMMUNE,
    );
    const categoriesPrec = await getTotalsByCategorie(
      userIds,
      dateDebutMoisPrec,
      dateFinMoisPrec,
      DEPENSE.TYPES_DEPENSE.COMMUNE,
    );
    const categoriesPrecMap = Object.fromEntries(
      categoriesPrec.map((c) => [String(c.categorieId), c]),
    );
    const categoriesEnHausse = categoriesActuel
      .map((cat) => {
        const precedent =
          categoriesPrecMap[String(cat.categorieId)]?.total || 0;
        const variation =
          precedent === 0 ? 100 : ((cat.total - precedent) / precedent) * 100;
        return {
          categorieId: cat.categorieId,
          nom: cat.nom || String(cat.categorieId),
          totalMoisActuel: cat.total,
          totalMoisPrecedent: precedent,
          variationPourcent: variation,
          variationValeur: cat.total - precedent,
        };
      })
      .filter((cat) => cat.variationPourcent > 20 && cat.variationValeur > 10);
    res.json({
      totaux: {
        personnellesMoi: totalDepensesPersonnellesMoi,
        personnellesPartenaire: totalDepensesPersonnellesPartenaire,
        communesCouple: totalDepensesCommunesCouple,
      },
      categoriesEnHausse,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
