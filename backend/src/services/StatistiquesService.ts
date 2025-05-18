import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import User from "../models/user.model";
import { IDepense } from "../types/depense.types";
import { IRevenu } from "../types/revenu.types";

export type UserIdsType = mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };

interface CategorieRepartition {
  _id: mongoose.Types.ObjectId;
  total: number;
  count: number;
  nom?: string;
}

interface SoldeInfo {
  totalRevenus: number;
  totalDepenses: number;
  solde: number;
}

interface ComparaisonInfo {
  actuel: number | SoldeInfo;
  precedent: number | SoldeInfo;
  difference: number;
}

interface ContributionCouple {
  utilisateurId: string;
  nom: string;
  totalDepenses: number;
  pourcentageDepenses: number;
  totalRevenus: number;
  pourcentageRevenus: number;
  solde: number;
}

class StatistiquesService {
  public async getTotalFluxMensuel(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
    typeFlux: "depense" | "revenu",
    model: mongoose.Model<any>,
    additionalMatch: Record<string, unknown> = {}
  ): Promise<number> {
    const match: Record<string, unknown> = {
      utilisateur: userIds,
      date: { $gte: dateDebut, $lte: dateFin },
      ...additionalMatch,
    };
    const result = await model.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$montant" } } },
    ]);
    return result[0]?.total || 0;
  }

  public async getSoldePourPeriode(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{ totalRevenus: number; totalDepenses: number; solde: number }> {
    const [totalRevenus, totalDepenses] = await Promise.all([
      this.getTotalFluxMensuel(userIds, dateDebut, dateFin, "revenu", RevenuModel),
      this.getTotalFluxMensuel(userIds, dateDebut, dateFin, "depense", DepenseModel),
    ]);
    return {
      totalRevenus,
      totalDepenses,
      solde: totalRevenus - totalDepenses,
    };
  }

  public async getRepartitionParCategorie(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
    typeFlux: "depense" | "revenu"
  ): Promise<CategorieRepartition[]> {
    const model = typeFlux === "depense" ? DepenseModel : RevenuModel;
    const categorieField = typeFlux === "depense" ? "categorie" : "categorieRevenu";
    const categorieCollection = typeFlux === "depense" ? "categories" : "categorierevenus";
    
    return model.aggregate([
      {
        $match: {
          utilisateur: userIds,
          date: { $gte: dateDebut, $lte: dateFin },
        },
      },
      {
        $group: {
          _id: `$${categorieField}`,
          total: { $sum: "$montant" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: categorieCollection,
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
          count: 1,
          nom: "$categorieDetails.nom",
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);
  }

  public async getComparaisonMois(
    userIds: UserIdsType,
    dateActuelle: Date,
    datePrecedente: Date,
    type: "depenses" | "revenus" | "solde"
  ): Promise<ComparaisonInfo> {
    const startActuelle = new Date(dateActuelle.getFullYear(), dateActuelle.getMonth(), 1);
    const endActuelle = new Date(dateActuelle.getFullYear(), dateActuelle.getMonth() + 1, 0, 23, 59, 59, 999);
    const startPrecedente = new Date(datePrecedente.getFullYear(), datePrecedente.getMonth(), 1);
    const endPrecedente = new Date(datePrecedente.getFullYear(), datePrecedente.getMonth() + 1, 0, 23, 59, 59, 999);
    if (type === "solde") {
      const [soldeActuel, soldePrecedent] = await Promise.all([
        this.getSoldePourPeriode(userIds, startActuelle, endActuelle),
        this.getSoldePourPeriode(userIds, startPrecedente, endPrecedente),
      ]);
      return {
        actuel: soldeActuel,
        precedent: soldePrecedent,
        difference: soldeActuel.solde - soldePrecedent.solde,
      };
    } else {
      const model = type === "depenses" ? DepenseModel : RevenuModel;
      const [totalActuel, totalPrecedent] = await Promise.all([
        this.getTotalFluxMensuel(userIds, startActuelle, endActuelle, type === "depenses" ? "depense" : "revenu", model),
        this.getTotalFluxMensuel(userIds, startPrecedente, endPrecedente, type === "depenses" ? "depense" : "revenu", model),
      ]);
      return {
        actuel: totalActuel,
        precedent: totalPrecedent,
        difference: totalActuel - totalPrecedent,
      };
    }
  }

  public async getEvolutionFluxMensuels(
    userIds: UserIdsType,
    nbMois: number,
    dateReference: Date,
    typeFlux: "depenses" | "revenus" | "solde",
    options?: { estRecurrent?: boolean }
  ): Promise<any[]> {
    const results: any[] = [];
    for (let i = nbMois - 1; i >= 0; i--) {
      const date = new Date(dateReference);
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      if (typeFlux === "solde") {
        const solde = await this.getSoldePourPeriode(userIds, start, end);
        results.push({ mois: start.getMonth() + 1, annee: start.getFullYear(), ...solde });
      } else {
        const model = typeFlux === "depenses" ? DepenseModel : RevenuModel;
        const match: Record<string, unknown> = {};
        if (options?.estRecurrent !== undefined) {
          match.estRecurrent = options.estRecurrent;
        }
        const total = await this.getTotalFluxMensuel(userIds, start, end, typeFlux === "depenses" ? "depense" : "revenu", model, match);
        results.push({ mois: start.getMonth() + 1, annee: start.getFullYear(), total });
      }
    }
    return results;
  }

  /**
   * Récupère la répartition des revenus par catégorie
   * @param userIds IDs des utilisateurs
   * @param dateDebut Date de début
   * @param dateFin Date de fin
   * @returns Tableau des catégories avec leurs montants
   */
  public async getRepartitionRevenusParCategorie(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date
  ): Promise<CategorieRepartition[]> {
    return this.getRepartitionParCategorie(userIds, dateDebut, dateFin, "revenu");
  }

  /**
   * Génère une synthèse mensuelle pour un couple
   * @param userIdPrincipal ID de l'utilisateur principal
   * @param partenaireId ID du partenaire
   * @param dateDebut Date de début
   * @param dateFin Date de fin
   * @returns Synthèse mensuelle du couple
   */
  public async getSyntheseMensuelleCouple(
    userIdPrincipal: string, 
    partenaireId: string, 
    dateDebut: Date, 
    dateFin: Date
  ): Promise<{
    soldeGlobal: SoldeInfo;
    utilisateurPrincipal: { nom: string; depenses: number; revenus: number; solde: number };
    partenaire: { nom: string; depenses: number; revenus: number; solde: number };
    ratioDependes: { utilisateurPrincipal: number; partenaire: number };
    ratioRevenus: { utilisateurPrincipal: number; partenaire: number };
  }> {
    // Si pas de partenaire, renvoyer des données vides
    if (!partenaireId) {
      return {
        soldeGlobal: { totalRevenus: 0, totalDepenses: 0, solde: 0 },
        utilisateurPrincipal: { nom: "", depenses: 0, revenus: 0, solde: 0 },
        partenaire: { nom: "", depenses: 0, revenus: 0, solde: 0 },
        ratioDependes: { utilisateurPrincipal: 0, partenaire: 0 },
        ratioRevenus: { utilisateurPrincipal: 0, partenaire: 0 },
      };
    }
    
    // Récupérer les utilisateurs
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal),
      User.findById(partenaireId)
    ]);
    
    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur ou partenaire non trouvé");
    }
    
    // Récupérer les soldes individuels et combinés
    const [soldeUtilisateurPrincipal, soldePartenaire, soldeGlobal] = await Promise.all([
      this.getSoldePourPeriode(new mongoose.Types.ObjectId(userIdPrincipal), dateDebut, dateFin),
      this.getSoldePourPeriode(new mongoose.Types.ObjectId(partenaireId), dateDebut, dateFin),
      this.getSoldePourPeriode(
        { $in: [new mongoose.Types.ObjectId(userIdPrincipal), new mongoose.Types.ObjectId(partenaireId)] },
        dateDebut, 
        dateFin
      )
    ]);
    
    // Calcul des ratios
    const totalDepenses = soldeUtilisateurPrincipal.totalDepenses + soldePartenaire.totalDepenses;
    const totalRevenus = soldeUtilisateurPrincipal.totalRevenus + soldePartenaire.totalRevenus;
    
    const ratioDepensesUtilisateur = totalDepenses > 0 
      ? (soldeUtilisateurPrincipal.totalDepenses / totalDepenses) * 100 
      : 0;
    const ratioDepensesPartenaire = totalDepenses > 0 
      ? (soldePartenaire.totalDepenses / totalDepenses) * 100 
      : 0;
      
    const ratioRevenusUtilisateur = totalRevenus > 0 
      ? (soldeUtilisateurPrincipal.totalRevenus / totalRevenus) * 100 
      : 0;
    const ratioRevenusPartenaire = totalRevenus > 0 
      ? (soldePartenaire.totalRevenus / totalRevenus) * 100 
      : 0;
    
    return {
      soldeGlobal,
      utilisateurPrincipal: {
        nom: utilisateurPrincipal.prenom || utilisateurPrincipal.email,
        depenses: soldeUtilisateurPrincipal.totalDepenses,
        revenus: soldeUtilisateurPrincipal.totalRevenus,
        solde: soldeUtilisateurPrincipal.solde
      },
      partenaire: {
        nom: partenaire.prenom || partenaire.email,
        depenses: soldePartenaire.totalDepenses,
        revenus: soldePartenaire.totalRevenus,
        solde: soldePartenaire.solde
      },
      ratioDependes: {
        utilisateurPrincipal: ratioDepensesUtilisateur,
        partenaire: ratioDepensesPartenaire
      },
      ratioRevenus: {
        utilisateurPrincipal: ratioRevenusUtilisateur,
        partenaire: ratioRevenusPartenaire
      }
    };
  }
  
  /**
   * Récupère les contributions d'un couple
   * @param userIdPrincipal ID de l'utilisateur principal
   * @param partenaireId ID du partenaire
   * @param dateDebut Date de début
   * @param dateFin Date de fin
   * @returns Informations sur les contributions du couple
   */
  public async getContributionsCouple(
    userIdPrincipal: string, 
    partenaireId: string, 
    dateDebut: Date, 
    dateFin: Date
  ): Promise<{
    contributionsUtilisateurs: ContributionCouple[];
    totalDepensesCouple: number;
    totalRevenusCouple: number;
    soldeCouple: number;
  }> {
    if (!partenaireId) {
      return {
        contributionsUtilisateurs: [],
        totalDepensesCouple: 0,
        totalRevenusCouple: 0,
        soldeCouple: 0
      };
    }
    
    // Récupérer les utilisateurs
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal),
      User.findById(partenaireId)
    ]);
    
    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur ou partenaire non trouvé");
    }
    
    // Récupérer les soldes
    const [soldeUtilisateurPrincipal, soldePartenaire, soldeCouple] = await Promise.all([
      this.getSoldePourPeriode(new mongoose.Types.ObjectId(userIdPrincipal), dateDebut, dateFin),
      this.getSoldePourPeriode(new mongoose.Types.ObjectId(partenaireId), dateDebut, dateFin),
      this.getSoldePourPeriode(
        { $in: [new mongoose.Types.ObjectId(userIdPrincipal), new mongoose.Types.ObjectId(partenaireId)] },
        dateDebut,
        dateFin
      )
    ]);
    
    // Calcul des pourcentages
    const pourcentageDepensesUtilisateur = soldeCouple.totalDepenses > 0 
      ? (soldeUtilisateurPrincipal.totalDepenses / soldeCouple.totalDepenses) * 100 
      : 0;
    const pourcentageDepensesPartenaire = soldeCouple.totalDepenses > 0 
      ? (soldePartenaire.totalDepenses / soldeCouple.totalDepenses) * 100 
      : 0;
      
    const pourcentageRevenusUtilisateur = soldeCouple.totalRevenus > 0 
      ? (soldeUtilisateurPrincipal.totalRevenus / soldeCouple.totalRevenus) * 100 
      : 0;
    const pourcentageRevenusPartenaire = soldeCouple.totalRevenus > 0 
      ? (soldePartenaire.totalRevenus / soldeCouple.totalRevenus) * 100 
      : 0;
    
    const contributionsUtilisateurs: ContributionCouple[] = [
      {
        utilisateurId: userIdPrincipal,
        nom: utilisateurPrincipal.prenom || utilisateurPrincipal.email,
        totalDepenses: soldeUtilisateurPrincipal.totalDepenses,
        pourcentageDepenses: pourcentageDepensesUtilisateur,
        totalRevenus: soldeUtilisateurPrincipal.totalRevenus,
        pourcentageRevenus: pourcentageRevenusUtilisateur,
        solde: soldeUtilisateurPrincipal.solde
      },
      {
        utilisateurId: partenaireId,
        nom: partenaire.prenom || partenaire.email,
        totalDepenses: soldePartenaire.totalDepenses,
        pourcentageDepenses: pourcentageDepensesPartenaire,
        totalRevenus: soldePartenaire.totalRevenus,
        pourcentageRevenus: pourcentageRevenusPartenaire,
        solde: soldePartenaire.solde
      }
    ];
    
    return {
      contributionsUtilisateurs,
      totalDepensesCouple: soldeCouple.totalDepenses,
      totalRevenusCouple: soldeCouple.totalRevenus,
      soldeCouple: soldeCouple.solde
    };
  }
  
  /**
   * Récupère les charges fixes d'un couple
   * @param userIdPrincipal ID de l'utilisateur principal
   * @param partenaireId ID du partenaire
   * @param dateDebut Date de début
   * @param dateFin Date de fin
   * @returns Informations sur les charges fixes du couple
   */
  public async getChargesFixesCouple(
    userIdPrincipal: string, 
    partenaireId: string, 
    dateDebut: Date, 
    dateFin: Date
  ): Promise<{
    chargesUtilisateurPrincipal: IDepense[];
    chargesPartenaire: IDepense[];
    totalChargesUtilisateurPrincipal: number;
    totalChargesPartenaire: number;
    totalChargesCouple: number;
  }> {
    if (!partenaireId) {
      return {
        chargesUtilisateurPrincipal: [],
        chargesPartenaire: [],
        totalChargesUtilisateurPrincipal: 0,
        totalChargesPartenaire: 0,
        totalChargesCouple: 0
      };
    }
    
    // Récupérer les charges fixes (dépenses récurrentes)
    const chargesUtilisateurPrincipal = await DepenseModel.find({
      utilisateur: new mongoose.Types.ObjectId(userIdPrincipal),
      date: { $gte: dateDebut, $lte: dateFin },
      estRecurrent: true
    }).populate('categorie').sort({ date: -1 });
    
    const chargesPartenaire = await DepenseModel.find({
      utilisateur: new mongoose.Types.ObjectId(partenaireId),
      date: { $gte: dateDebut, $lte: dateFin },
      estRecurrent: true
    }).populate('categorie').sort({ date: -1 });
    
    // Calculer les totaux
    const totalChargesUtilisateurPrincipal = chargesUtilisateurPrincipal.reduce((sum, depense) => sum + depense.montant, 0);
    const totalChargesPartenaire = chargesPartenaire.reduce((sum, depense) => sum + depense.montant, 0);
    const totalChargesCouple = totalChargesUtilisateurPrincipal + totalChargesPartenaire;
    
    return {
      chargesUtilisateurPrincipal,
      chargesPartenaire,
      totalChargesUtilisateurPrincipal,
      totalChargesPartenaire,
      totalChargesCouple
    };
  }
}

export const statistiquesService = new StatistiquesService();
