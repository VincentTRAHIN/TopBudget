import { Response, NextFunction } from "express";
import Depense from "../models/depense.model";
import logger from "../utils/logger.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { AUTH, STATISTIQUES } from "../constants";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import User from "../models/user.model";
import { IUser } from "../types/user.types";
import { statistiquesService } from "../services/StatistiquesService";
import { sendSuccess, sendErrorClient } from '../utils/response.utils';
import { getUserIdsFromContext } from '../utils/utilisateur.utils';

export const totalDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    let { mois, annee, contexte, categorie } = req.query;
    
    if (!mois || !annee) {
      const dateActuelle = new Date();
      mois = format(dateActuelle, "MM");
      annee = format(dateActuelle, "yyyy");
    }
    
    const dateDebut = new Date(`${annee}-${mois}-01`);
    const dateFin = new Date(`${annee}-${mois}-31`);
    
    const userContext = await getUserIdsFromContext(req, res, contexte as string | undefined);
    if (!userContext) {
      return;
    }
    
    const match: Record<string, unknown> = {};
    if (categorie) {
      match.categorie = categorie as string;
    }
    
    const total = await statistiquesService.getTotalFluxMensuel(
      userContext.userIds,
      dateDebut,
      dateFin,
      "depense",
      Depense,
      match,
    );
    
    const depenses = await Depense.find({
      utilisateur: userContext.utilisateurFilter,
      date: { $gte: dateDebut, $lte: dateFin },
      ...match,
    });
    
    sendSuccess(res, { depenses, total });
  } catch (error) {
    logger.error("Erreur lors du calcul des dépenses mensuelles:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_DEPENSES_MENSUELLES, 500));
  }
};

export const repartitionParCategorie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { mois, annee, contexte } = req.query;
    
    if (!mois || !annee) {
      sendErrorClient(res, "Les paramètres mois et année sont requis");
      return;
    }
    
    const dateDebut = new Date(`${annee}-${mois}-01`);
    const dateFin = new Date(`${annee}-${mois}-31`);
    
    const userContext = await getUserIdsFromContext(req, res, contexte as string | undefined);
    if (!userContext) {
      return;
    }
    
    const repartition = await statistiquesService.getRepartitionParCategorie(
      userContext.userIds,
      dateDebut,
      dateFin,
      "depense"
    );
    
    sendSuccess(res, repartition);
  } catch (error) {
    logger.error("Erreur lors du calcul de la répartition par catégorie:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_REPARTITION_CATEGORIE, 500));
  }
};

export const getSoldeMensuel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { mois: moisQuery, annee: anneeQuery, contexte } = req.query as { mois?: string; annee?: string; contexte?: string };
    
    const now = new Date();
    const currentMonth = moisQuery ? parseInt(moisQuery, 10) - 1 : now.getMonth();
    const currentYear = anneeQuery ? parseInt(anneeQuery, 10) : now.getFullYear();
    
    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));
    
    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }
    
    const resultatSolde = await statistiquesService.getSoldePourPeriode(
      userContext.userIds,
      dateDebutMois,
      dateFinMois
    );
    
    sendSuccess(res, {
      mois: format(dateDebutMois, "yyyy-MM"),
      ...resultatSolde
    });
  } catch (error) {
    logger.error("Erreur lors du calcul du solde mensuel:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_SOLDE_MENSUEL, 500));
  }
};

export const comparaisonMois = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { contexte, type = "depenses" } = req.query as { contexte?: string; type?: "depenses" | "revenus" | "solde" };
    
    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }
    
    let dateQueryActuelle: Date;
    let dateQueryPrecedente: Date;
    const { moisActuel: moisActuelQuery, anneeActuelle: anneeActuelleQuery, moisPrecedent: moisPrecedentQuery, anneePrecedente: anneePrecedenteQuery } = req.query;
    
    if (moisActuelQuery && anneeActuelleQuery && moisPrecedentQuery && anneePrecedenteQuery) {
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
    
    const result = await statistiquesService.getComparaisonMois(
      userContext.userIds,
      dateQueryActuelle,
      dateQueryPrecedente,
      type
    );
    
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Erreur lors de la comparaison des mois:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_COMPARAISON_MOIS, 500));
  }
};

export const getEvolutionDepensesMensuelles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
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
        sendErrorClient(res, "Le paramètre nbMois doit être un nombre entre 1 et 24.");
        return;
      }
    }
    
    const userContext = await getUserIdsFromContext(req, res, contexte as string | undefined);
    if (!userContext) {
      return;
    }
    
    const dateActuelle = new Date();
    const evolution = await statistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      "depenses"
    );
    
    sendSuccess(res, evolution);
  } catch (error) {
    logger.error("Erreur lors du calcul de l'évolution des dépenses mensuelles:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_EVOLUTION_DEPENSES, 500));
  }
};

export const getEvolutionRevenusMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { nbMois: nbMoisQuery, contexte, estRecurrent } = req.query as { nbMois?: string; contexte?: string; estRecurrent?: string };
    let nbMois = 6;
    
    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        sendErrorClient(res, "Le paramètre nbMois doit être un nombre entre 1 et 24.");
        return;
      }
    }
    
    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }
    
    const dateActuelle = new Date();
    const options: { estRecurrent?: boolean } = {};
    
    if (typeof estRecurrent !== "undefined") {
      options.estRecurrent = estRecurrent === "true";
    }
    
    const evolution = await statistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      "revenus",
      options
    );
    
    sendSuccess(res, evolution);
  } catch (error) {
    logger.error("Erreur lors du calcul de l'évolution des revenus mensuels:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_EVOLUTION_REVENUS, 500));
  }
};

export const getEvolutionSoldesMensuels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { nbMois: nbMoisQuery, contexte } = req.query as { nbMois?: string; contexte?: string };
    let nbMois = 6;
    
    if (nbMoisQuery) {
      const parsedNbMois = parseInt(nbMoisQuery, 10);
      if (!isNaN(parsedNbMois) && parsedNbMois >= 1 && parsedNbMois <= 24) {
        nbMois = parsedNbMois;
      } else {
        sendErrorClient(res, "Le paramètre nbMois doit être un nombre entre 1 et 24.");
        return;
      }
    }
    
    const userContext = await getUserIdsFromContext(req, res, contexte);
    if (!userContext) {
      return;
    }
    
    const dateActuelle = new Date();
    const evolution = await statistiquesService.getEvolutionFluxMensuels(
      userContext.userIds,
      nbMois,
      dateActuelle,
      "solde"
    );
    
    sendSuccess(res, evolution);
  } catch (error) {
    logger.error("Erreur lors du calcul de l'évolution des soldes mensuels:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_EVOLUTION_SOLDES, 500));
  }
};

export const getCoupleContributionsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, "Utilisateur non authentifié.");
      return;
    }
    
    const fullCurrentUser = await User.findById(req.user.id).populate<{ partenaireId: IUser }>("partenaireId");
    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      sendErrorClient(res, "Partenaire non défini pour l'utilisateur ou non trouvé.");
      return;
    }
    
    const { mois: moisQuery, annee: anneeQuery } = req.query as { mois?: string; annee?: string };
    const now = new Date();
    const currentMonth = moisQuery ? parseInt(moisQuery, 10) - 1 : now.getMonth();
    const currentYear = anneeQuery ? parseInt(anneeQuery, 10) : now.getFullYear();
    
    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));
    
    const userId = String(req.user.id);
    const partenaireId = String(fullCurrentUser.partenaireId._id);
    
    const result = await statistiquesService.getContributionsCouple(
      userId, 
      partenaireId, 
      dateDebutMois, 
      dateFinMois
    );
    
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Erreur lors du calcul du résumé des contributions du couple:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_CONTRIBUTIONS_COUPLE, 500));
  }
};

export const getCoupleFixedCharges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, "Utilisateur non authentifié.");
      return;
    }
    
    const fullCurrentUser = await User.findById(req.user.id);
    if (!fullCurrentUser || !fullCurrentUser.partenaireId) {
      sendErrorClient(res, "Partenaire non défini pour l'utilisateur.");
      return;
    }
    
    const { mois: moisQuery, annee: anneeQuery } = req.query as { mois?: string; annee?: string };
    const now = new Date();
    const currentMonth = moisQuery ? parseInt(moisQuery, 10) - 1 : now.getMonth();
    const currentYear = anneeQuery ? parseInt(anneeQuery, 10) : now.getFullYear();
    
    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));
    
    const userId = String(req.user.id);
    const partenaireId = String(fullCurrentUser.partenaireId);
    
    const result = await statistiquesService.getChargesFixesCouple(
      userId, 
      partenaireId, 
      dateDebutMois, 
      dateFinMois
    );
    
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Erreur lors de la récupération des charges fixes du couple:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_CHARGES_FIXES, 500));
  }
};

export const getSyntheseMensuelle = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { mois: moisQuery, annee: anneeQuery, contexte } = req.query as { mois?: string; annee?: string; contexte?: string };
    
    const now = new Date();
    const currentMonth = moisQuery ? parseInt(moisQuery, 10) - 1 : now.getMonth();
    const currentYear = anneeQuery ? parseInt(anneeQuery, 10) : now.getFullYear();
    
    const dateDebutMois = startOfMonth(new Date(currentYear, currentMonth));
    const dateFinMois = endOfMonth(new Date(currentYear, currentMonth));
    
    let partenaireId = "";
    if (contexte === "couple") {
      const fullCurrentUser = await User.findById(req.user.id);
      if (fullCurrentUser && fullCurrentUser.partenaireId) {
        partenaireId = String(fullCurrentUser.partenaireId);
      }
    }
    
    const result = await statistiquesService.getSyntheseMensuelleCouple(
      String(req.user.id),
      partenaireId,
      dateDebutMois,
      dateFinMois
    );
    
    sendSuccess(res, result);
  } catch (error) {
    logger.error("Erreur lors de la génération de la synthèse mensuelle:", error);
    next(new AppError(STATISTIQUES.ERROR_MESSAGES.SERVER_ERROR_SYNTHESE_MENSUELLE, 500));
  }
};

export const repartitionRevenusParCategorie = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      sendErrorClient(res, AUTH.ERROR_MESSAGES.UNAUTHORIZED);
      return;
    }
    
    const { mois, annee, contexte } = req.query;
    if (!mois || !annee) {
      sendErrorClient(res, "Les paramètres mois et année sont requis");
      return;
    }
    
    const dateDebut = new Date(`${annee}-${mois}-01`);
    const dateFin = new Date(`${annee}-${mois}-31`);
    
    const userContext = await getUserIdsFromContext(req, res, contexte as string | undefined);
    if (!userContext) {
      return;
    }
    
    const repartition = await statistiquesService.getRepartitionRevenusParCategorie(
      userContext.userIds,
      dateDebut,
      dateFin
    );
    
    sendSuccess(res, repartition);
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
