import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import User from "../models/user.model";
import { IDepensePopulated } from "../types/depense.types";
import { IUserPopulated } from "../types/user.types";
import logger from "../utils/logger.utils";

export type UserIdsType =
  | mongoose.Types.ObjectId
  | { $in: ReadonlyArray<mongoose.Types.ObjectId> };

interface CategorieRepartition {
  readonly _id: mongoose.Types.ObjectId;
  readonly total: number;
  readonly count: number;
  readonly nom?: string;
}

interface SoldeInfo {
  readonly totalRevenus: number;
  readonly totalDepenses: number;
  readonly solde: number;
}

interface ComparaisonInfo {
  readonly actuel: number | SoldeInfo;
  readonly precedent: number | SoldeInfo;
  readonly difference: number;
}

interface ContributionCouple {
  readonly utilisateurId: string;
  readonly nom: string;
  readonly totalDepenses: number;
  readonly pourcentageDepenses: number;
  readonly totalRevenus: number;
  readonly pourcentageRevenus: number;
  readonly solde: number;
}

interface EvolutionFluxResult {
  readonly mois: number;
  readonly annee: number;
  readonly total?: number;
  readonly totalRevenus?: number;
  readonly totalDepenses?: number;
  readonly solde?: number;
}

export class StatistiquesService {
  static async getTotalFluxMensuel(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
    typeFlux: "depense" | "revenu",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any,
    additionalMatch: Record<string, unknown> = {},
  ): Promise<number> {
    // logService("StatistiquesService", "getTotalFluxMensuel", { // Commenté pour réduire le bruit
    //   userIds: JSON.stringify(userIds),
    //   dateDebut: dateDebut.toISOString(),
    //   dateFin: dateFin.toISOString(),
    //   typeFlux,
    //   modelName: model.modelName,
    //   additionalMatch,
    // });

    const match: Record<string, unknown> = {
      utilisateur: userIds,
      date: { $gte: dateDebut, $lte: dateFin },
      ...additionalMatch,
    };

    const result = await model.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: "$montant" } } },
    ]);
    const total = result[0]?.total || 0;
    // logService("StatistiquesService", "getTotalFluxMensuel", { // Commenté pour réduire le bruit
    //   message: `Résultat calculé pour ${typeFlux}`,
    //   total
    // });
    return total;
  }

  static async getSoldePourPeriode(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<{ totalRevenus: number; totalDepenses: number; solde: number }> {
    // logService("StatistiquesService", "getSoldePourPeriode", { // Commenté pour réduire le bruit
    //   userIds: JSON.stringify(userIds),
    //   dateDebut: dateDebut.toISOString(),
    //   dateFin: dateFin.toISOString(),
    // });

    const [totalRevenus, totalDepenses] = await Promise.all([
      this.getTotalFluxMensuel(
        userIds,
        dateDebut,
        dateFin,
        "revenu",
        RevenuModel,
      ),
      this.getTotalFluxMensuel(
        userIds,
        dateDebut,
        dateFin,
        "depense",
        DepenseModel,
      ),
    ]);


    return {
      totalRevenus,
      totalDepenses,
      solde: totalRevenus - totalDepenses,
    };
  }

  static async getRepartitionParCategorie(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
    typeFlux: "depense" | "revenu",
  ): Promise<CategorieRepartition[]> {
    // logService("StatistiquesService", "getRepartitionParCategorie", { // Commenté temporairement pour le test spécifique
    //   userIds: JSON.stringify(userIds),
    //   dateDebut,
    //   dateFin,
    //   typeFlux,
    // });
    logger.debug("[svc.getRepartitionParCategorie] Appel avec:", { userIds, dateDebut: dateDebut.toISOString(), dateFin: dateFin.toISOString(), typeFlux });

    const model = typeFlux === "depense" ? DepenseModel : RevenuModel;
    const categorieField =
      typeFlux === "depense" ? "categorie" : "categorieRevenu";
    const categorieCollection =
      typeFlux === "depense" ? "categories" : "categorierevenus";

    // logService("StatistiquesService", "getRepartitionParCategorie", {
    //   modelName: model.modelName,
    // });
    // logService("StatistiquesService", "getRepartitionParCategorie", {
    //   categorieCollection,
    // });
    // logService("StatistiquesService", "getRepartitionParCategorie", {
    //   categorieField,
    // });

    const aggregationPipeline: mongoose.PipelineStage[] = [
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
    ];

    // logService("StatistiquesService", "getRepartitionParCategorie", {
    //   firstStage: JSON.stringify(aggregationPipeline[0]),
    //   secondStage: JSON.stringify(aggregationPipeline[1]),
    // });

    const resultatAggregation = await model.aggregate(aggregationPipeline);
    logger.debug("[svc.getRepartitionParCategorie] resultatAggregation brut:", resultatAggregation);

    // logService("StatistiquesService", "getRepartitionParCategorie", { // Commenté temporairement pour le test spécifique
    //   resultatAggregation,
    // });

    return resultatAggregation;
  }

  static async getComparaisonMois(
    userIds: UserIdsType,
    dateActuelle: Date,
    datePrecedente: Date,
    type: "depenses" | "revenus" | "solde",
  ): Promise<ComparaisonInfo> {
    const startActuelle = new Date(
      dateActuelle.getFullYear(),
      dateActuelle.getMonth(),
      1,
    );
    const endActuelle = new Date(
      dateActuelle.getFullYear(),
      dateActuelle.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const startPrecedente = new Date(
      datePrecedente.getFullYear(),
      datePrecedente.getMonth(),
      1,
    );
    const endPrecedente = new Date(
      datePrecedente.getFullYear(),
      datePrecedente.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
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
        this.getTotalFluxMensuel(
          userIds,
          startActuelle,
          endActuelle,
          type === "depenses" ? "depense" : "revenu",
          model,
        ),
        this.getTotalFluxMensuel(
          userIds,
          startPrecedente,
          endPrecedente,
          type === "depenses" ? "depense" : "revenu",
          model,
        ),
      ]);
      return {
        actuel: totalActuel,
        precedent: totalPrecedent,
        difference: totalActuel - totalPrecedent,
      };
    }
  }

  static async getEvolutionFluxMensuels(
    userIds: UserIdsType,
    nbMois: number,
    dateReference: Date,
    typeFlux: "depenses" | "revenus" | "solde",
    options?: { estRecurrent?: boolean },
  ): Promise<EvolutionFluxResult[]> {
    const results: EvolutionFluxResult[] = [];
    for (let i = nbMois - 1; i >= 0; i--) {
      const date = new Date(dateReference);
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const baseResult = {
        mois: start.getMonth() + 1,
        annee: start.getFullYear(),
      };

      if (typeFlux === "solde") {
        const solde = await this.getSoldePourPeriode(userIds, start, end);
        results.push({
          ...baseResult,
          ...solde,
        });
      } else {
        const model = typeFlux === "depenses" ? DepenseModel : RevenuModel;
        const match: Record<string, unknown> = {};
        if (options?.estRecurrent !== undefined) {
          match.estRecurrent = options.estRecurrent;
        }
        const total = await this.getTotalFluxMensuel(
          userIds,
          start,
          end,
          typeFlux === "depenses" ? "depense" : "revenu",
          model,
          match,
        );

        if (typeFlux === "depenses") {
          const totalRevenus = await this.getTotalFluxMensuel(
            userIds,
            start,
            end,
            "revenu",
            RevenuModel,
          );

          results.push({
            ...baseResult,
            totalDepenses: total,
            totalRevenus,
            solde: totalRevenus - total,
          });
        } else if (typeFlux === "revenus") {
          const totalDepenses = await this.getTotalFluxMensuel(
            userIds,
            start,
            end,
            "depense",
            DepenseModel,
          );

          results.push({
            ...baseResult,
            totalRevenus: total,
            totalDepenses,
            solde: total - totalDepenses,
          });
        }
      }
    }

    return results;
  }

  static async getRepartitionRevenusParCategorie(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<CategorieRepartition[]> {
    return this.getRepartitionParCategorie(
      userIds,
      dateDebut,
      dateFin,
      "revenu",
    );
  }

  static async getSyntheseMensuelleCouple(
    userIdPrincipal: string,
    partenaireId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<{
    soldeGlobal: SoldeInfo;
    utilisateurPrincipal: {
      nom: string;
      depenses: number;
      revenus: number;
      solde: number;
    };
    partenaire: {
      nom: string;
      depenses: number;
      revenus: number;
      solde: number;
    };
    ratioDependes: { utilisateurPrincipal: number; partenaire: number };
    ratioRevenus: { utilisateurPrincipal: number; partenaire: number };
  }> {
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal).lean<IUserPopulated>(),
      User.findById(partenaireId).lean<IUserPopulated>(),
    ]);

    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur principal ou partenaire non trouvé");
    }

    const [statsPrincipal, statsPartenaire] = await Promise.all([
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(userIdPrincipal),
        dateDebut,
        dateFin,
      ),
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(partenaireId),
        dateDebut,
        dateFin,
      ),
    ]);

    const totalDepensesCouple =
      statsPrincipal.totalDepenses + statsPartenaire.totalDepenses;
    const totalRevenusCouple =
      statsPrincipal.totalRevenus + statsPartenaire.totalRevenus;
    const soldeGlobal = totalRevenusCouple - totalDepensesCouple;

    const ratioDependes = {
      utilisateurPrincipal:
        totalDepensesCouple === 0
          ? 0
          : (statsPrincipal.totalDepenses / totalDepensesCouple) * 100,
      partenaire:
        totalDepensesCouple === 0
          ? 0
          : (statsPartenaire.totalDepenses / totalDepensesCouple) * 100,
    };

    const ratioRevenus = {
      utilisateurPrincipal:
        totalRevenusCouple === 0
          ? 0
          : (statsPrincipal.totalRevenus / totalRevenusCouple) * 100,
      partenaire:
        totalRevenusCouple === 0
          ? 0
          : (statsPartenaire.totalRevenus / totalRevenusCouple) * 100,
    };

    return {
      soldeGlobal: {
        totalRevenus: totalRevenusCouple,
        totalDepenses: totalDepensesCouple,
        solde: soldeGlobal,
      },
      utilisateurPrincipal: {
        nom: utilisateurPrincipal.nom,
        depenses: statsPrincipal.totalDepenses,
        revenus: statsPrincipal.totalRevenus,
        solde: statsPrincipal.solde,
      },
      partenaire: {
        nom: partenaire.nom,
        depenses: statsPartenaire.totalDepenses,
        revenus: statsPartenaire.totalRevenus,
        solde: statsPartenaire.solde,
      },
      ratioDependes,
      ratioRevenus,
    };
  }

  static async getContributionsCouple(
    userIdPrincipal: string,
    partenaireId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<{
    contributionsUtilisateurs: ContributionCouple[];
    totalDepensesCouple: number;
    totalRevenusCouple: number;
    soldeCouple: number;
  }> {
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal).lean<IUserPopulated>(),
      User.findById(partenaireId).lean<IUserPopulated>(),
    ]);

    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur principal ou partenaire non trouvé");
    }

    const [statsPrincipal, statsPartenaire] = await Promise.all([
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(userIdPrincipal),
        dateDebut,
        dateFin,
      ),
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(partenaireId),
        dateDebut,
        dateFin,
      ),
    ]);

    const totalDepensesCouple =
      statsPrincipal.totalDepenses + statsPartenaire.totalDepenses;
    const totalRevenusCouple =
      statsPrincipal.totalRevenus + statsPartenaire.totalRevenus;

    const pourcentageDepensesPrincipal =
      totalDepensesCouple === 0
        ? 0
        : (statsPrincipal.totalDepenses / totalDepensesCouple) * 100;
    const pourcentageDepensesPartenaire =
      totalDepensesCouple === 0
        ? 0
        : (statsPartenaire.totalDepenses / totalDepensesCouple) * 100;

    const pourcentageRevenusPrincipal =
      totalRevenusCouple === 0
        ? 0
        : (statsPrincipal.totalRevenus / totalRevenusCouple) * 100;
    const pourcentageRevenusPartenaire =
      totalRevenusCouple === 0
        ? 0
        : (statsPartenaire.totalRevenus / totalRevenusCouple) * 100;

    const contributionsUtilisateurs: ContributionCouple[] = [
      {
        utilisateurId: userIdPrincipal,
        nom: utilisateurPrincipal.nom,
        totalDepenses: statsPrincipal.totalDepenses,
        pourcentageDepenses: pourcentageDepensesPrincipal,
        totalRevenus: statsPrincipal.totalRevenus,
        pourcentageRevenus: pourcentageRevenusPrincipal,
        solde: statsPrincipal.solde,
      },
      {
        utilisateurId: partenaireId,
        nom: partenaire.nom,
        totalDepenses: statsPartenaire.totalDepenses,
        pourcentageDepenses: pourcentageDepensesPartenaire,
        totalRevenus: statsPartenaire.totalRevenus,
        pourcentageRevenus: pourcentageRevenusPartenaire,
        solde: statsPartenaire.solde,
      },
    ];

    return {
      contributionsUtilisateurs,
      totalDepensesCouple,
      totalRevenusCouple,
      soldeCouple: totalRevenusCouple - totalDepensesCouple,
    };
  }

  static async getChargesFixesCouple(
    userIdPrincipal: string,
    partenaireId: string,
    dateDebut: Date,
    dateFin: Date,
  ): Promise<{
    chargesUtilisateurPrincipal: IDepensePopulated[];
    chargesPartenaire: IDepensePopulated[];
    totalChargesUtilisateurPrincipal: number;
    totalChargesPartenaire: number;
    totalChargesCouple: number;
  }> {
    const [chargesUtilisateurPrincipal, chargesPartenaire] = await Promise.all([
      DepenseModel.find({
        utilisateur: new mongoose.Types.ObjectId(userIdPrincipal),
        date: { $gte: dateDebut, $lte: dateFin },
        estChargeFixe: true,
      })
        .populate("categorie", "nom")
        .sort({ date: -1 })
        .lean<IDepensePopulated[]>(),

      DepenseModel.find({
        utilisateur: new mongoose.Types.ObjectId(partenaireId),
        date: { $gte: dateDebut, $lte: dateFin },
        estChargeFixe: true,
      })
        .populate("categorie", "nom")
        .sort({ date: -1 })
        .lean<IDepensePopulated[]>(),
    ]);

    const totalChargesUtilisateurPrincipal = chargesUtilisateurPrincipal.reduce(
      (acc: number, charge: IDepensePopulated) => acc + charge.montant,
      0,
    );

    const totalChargesPartenaire = chargesPartenaire.reduce(
      (acc: number, charge: IDepensePopulated) => acc + charge.montant,
      0,
    );

    const totalChargesCouple =
      totalChargesUtilisateurPrincipal + totalChargesPartenaire;

    return {
      chargesUtilisateurPrincipal,
      chargesPartenaire,
      totalChargesUtilisateurPrincipal,
      totalChargesPartenaire,
      totalChargesCouple,
    };
  }
}
