import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import RevenuModel from "../models/revenu.model";
import User from "../models/user.model";
import { IDepensePopulated } from "../types/depense.types";
import { IUserPopulated } from "../types/user.types";

export type UserIdsType =
  | mongoose.Types.ObjectId
  | { $in: ReadonlyArray<mongoose.Types.ObjectId> };

interface CategorieRepartition {
  readonly _id: mongoose.Types.ObjectId;
  readonly total: number;
  readonly count: number;
  readonly nom?: string;
}

interface CategorieEnHausse {
  readonly categorieId: string;
  readonly nom: string;
  readonly totalMoisActuel: number;
  readonly totalMoisPrecedent: number;
  readonly variationPourcent: number;
  readonly variationValeur: number;
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
    const total = result[0]?.total || 0;

    return total;
  }

  static async getSoldePourPeriode(
    userIds: UserIdsType,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{ totalRevenus: number; totalDepenses: number; solde: number }> {

    const [totalRevenus, totalDepenses] = await Promise.all([
      this.getTotalFluxMensuel(
        userIds,
        dateDebut,
        dateFin,
        "revenu",
        RevenuModel
      ),
      this.getTotalFluxMensuel(
        userIds,
        dateDebut,
        dateFin,
        "depense",
        DepenseModel
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
    typeFlux: "depense" | "revenu"
  ): Promise<CategorieRepartition[]> {
    const model = typeFlux === "depense" ? DepenseModel : RevenuModel;
    const categorieField =
      typeFlux === "depense" ? "categorie" : "categorieRevenu";
    const categorieCollection =
      typeFlux === "depense" ? "categories" : "categorierevenus";

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

    const resultatAggregation = await model.aggregate(aggregationPipeline);

    return resultatAggregation;
  }

  static async getComparaisonMois(
    userIds: UserIdsType,
    dateActuelle: Date,
    datePrecedente: Date,
    type: "depenses" | "revenus" | "solde"
  ): Promise<ComparaisonInfo> {
    const startActuelle = new Date(
      dateActuelle.getFullYear(),
      dateActuelle.getMonth(),
      1
    );
    const endActuelle = new Date(
      dateActuelle.getFullYear(),
      dateActuelle.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const startPrecedente = new Date(
      datePrecedente.getFullYear(),
      datePrecedente.getMonth(),
      1
    );
    const endPrecedente = new Date(
      datePrecedente.getFullYear(),
      datePrecedente.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
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
          model
        ),
        this.getTotalFluxMensuel(
          userIds,
          startPrecedente,
          endPrecedente,
          type === "depenses" ? "depense" : "revenu",
          model
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
    options?: { estRecurrent?: boolean }
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
        999
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
          match
        );

        if (typeFlux === "depenses") {
          const totalRevenus = await this.getTotalFluxMensuel(
            userIds,
            start,
            end,
            "revenu",
            RevenuModel
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
            DepenseModel
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
    dateFin: Date
  ): Promise<CategorieRepartition[]> {
    const result = await this.getRepartitionParCategorie(
      userIds,
      dateDebut,
      dateFin,
      "revenu"
    );
    return result;
  }

  static async getCategoriesEnHausse(
    userIds: UserIdsType,
    dateDebutMoisActuel: Date,
    dateFinMoisActuel: Date,
    seuilPourcentageMinimum: number = 20,
    seuilValeurMinimum: number = 10
  ): Promise<CategorieEnHausse[]> {
    const dateDebutMoisPrecedent = new Date(dateDebutMoisActuel);
    dateDebutMoisPrecedent.setMonth(dateDebutMoisPrecedent.getMonth() - 1);
    
    const dateFinMoisPrecedent = new Date(dateFinMoisActuel);
    dateFinMoisPrecedent.setMonth(dateFinMoisPrecedent.getMonth() - 1);

    const [categoriesMoisActuel, categoriesMoisPrecedent] = await Promise.all([
      this.getRepartitionParCategorie(
        userIds,
        dateDebutMoisActuel,
        dateFinMoisActuel,
        "depense"
      ),
      this.getRepartitionParCategorie(
        userIds,
        dateDebutMoisPrecedent,
        dateFinMoisPrecedent,
        "depense"
      ),
    ]);

    const categoriesPrecedentesMap = new Map<string, number>();
    categoriesMoisPrecedent.forEach((cat) => {
      categoriesPrecedentesMap.set(cat._id.toString(), cat.total);
    });

    const categoriesEnHausse: CategorieEnHausse[] = [];

    categoriesMoisActuel.forEach((categorieActuelle) => {
      const categorieId = categorieActuelle._id.toString();
      const totalMoisActuel = categorieActuelle.total;
      const totalMoisPrecedent = categoriesPrecedentesMap.get(categorieId) || 0;
      
      const variationValeur = totalMoisActuel - totalMoisPrecedent;
      
      if (variationValeur <= 0) {
        return;
      }

      let variationPourcent: number;
      if (totalMoisPrecedent === 0) {
        variationPourcent = totalMoisActuel > 0 ? 100 : 0;
      } else {
        variationPourcent = (variationValeur / totalMoisPrecedent) * 100;
      }

      const respecteSeuilPourcentage = variationPourcent >= seuilPourcentageMinimum;
      const respecteSeuilValeur = variationValeur >= seuilValeurMinimum;

      if (respecteSeuilPourcentage && respecteSeuilValeur) {
        categoriesEnHausse.push({
          categorieId,
          nom: categorieActuelle.nom || "Catégorie inconnue",
          totalMoisActuel,
          totalMoisPrecedent,
          variationPourcent: Math.round(variationPourcent * 100) / 100,
          variationValeur: Math.round(variationValeur * 100) / 100,
        });
      }
    });

    return categoriesEnHausse.sort((a, b) => b.variationPourcent - a.variationPourcent);
  }

  static async getSyntheseMensuelleCouple(
    userIdPrincipal: string,
    partenaireId: string,
    dateDebut: Date,
    dateFin: Date
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
    categoriesEnHausse: CategorieEnHausse[];
  }> {
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal).select("nom _id").lean<IUserPopulated>(),
      User.findById(partenaireId).select("nom _id").lean<IUserPopulated>(),
    ]);

    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur principal ou partenaire non trouvé");
    }

    const userIds = {
      $in: [
        new mongoose.Types.ObjectId(userIdPrincipal),
        new mongoose.Types.ObjectId(partenaireId),
      ],
    };

    const [statsPrincipal, statsPartenaire, categoriesEnHausse] = await Promise.all([
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(userIdPrincipal),
        dateDebut,
        dateFin
      ),
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(partenaireId),
        dateDebut,
        dateFin
      ),
      this.getCategoriesEnHausse(userIds, dateDebut, dateFin),
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
      categoriesEnHausse,
    };
  }

  static async getSyntheseMensuelleUtilisateur(
    userId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    soldeGlobal: SoldeInfo;
    utilisateurPrincipal: {
      nom: string;
      depenses: number;
      revenus: number;
      solde: number;
    };
    categoriesEnHausse: CategorieEnHausse[];
  }> {
    const utilisateur = await User.findById(userId)
      .select("nom _id")
      .lean<IUserPopulated>();

    if (!utilisateur) {
      throw new Error("Utilisateur non trouvé");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [statsUtilisateur, categoriesEnHausse] = await Promise.all([
      this.getSoldePourPeriode(userObjectId, dateDebut, dateFin),
      this.getCategoriesEnHausse(userObjectId, dateDebut, dateFin),
    ]);

    return {
      soldeGlobal: {
        totalRevenus: statsUtilisateur.totalRevenus,
        totalDepenses: statsUtilisateur.totalDepenses,
        solde: statsUtilisateur.solde,
      },
      utilisateurPrincipal: {
        nom: utilisateur.nom,
        depenses: statsUtilisateur.totalDepenses,
        revenus: statsUtilisateur.totalRevenus,
        solde: statsUtilisateur.solde,
      },
      categoriesEnHausse,
    };
  }

  static async getContributionsCouple(
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
    const [utilisateurPrincipal, partenaire] = await Promise.all([
      User.findById(userIdPrincipal).select("nom _id").lean<IUserPopulated>(),
      User.findById(partenaireId).select("nom _id").lean<IUserPopulated>(),
    ]);

    if (!utilisateurPrincipal || !partenaire) {
      throw new Error("Utilisateur principal ou partenaire non trouvé");
    }

    const [statsPrincipal, statsPartenaire] = await Promise.all([
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(userIdPrincipal),
        dateDebut,
        dateFin
      ),
      this.getSoldePourPeriode(
        new mongoose.Types.ObjectId(partenaireId),
        dateDebut,
        dateFin
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
    dateFin: Date
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
        .select("montant date categorie description typeCompte typeDepense estChargeFixe commentaire utilisateur")
        .populate({
          path: "categorie",
          select: "nom _id"
        })
        .sort({ date: -1 })
        .lean<IDepensePopulated[]>(),

      DepenseModel.find({
        utilisateur: new mongoose.Types.ObjectId(partenaireId),
        date: { $gte: dateDebut, $lte: dateFin },
        estChargeFixe: true,
      })
        .select("montant date categorie description typeCompte typeDepense estChargeFixe commentaire utilisateur")
        .populate({
          path: "categorie",
          select: "nom _id"
        })
        .sort({ date: -1 })
        .lean<IDepensePopulated[]>(),
    ]);

    const totalChargesUtilisateurPrincipal = chargesUtilisateurPrincipal.reduce(
      (acc: number, charge: IDepensePopulated) => acc + charge.montant,
      0
    );

    const totalChargesPartenaire = chargesPartenaire.reduce(
      (acc: number, charge: IDepensePopulated) => acc + charge.montant,
      0
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

  /**
   * Récupère les charges fixes du mois en cours avec leur statut (payées ou à venir)
   * @param userIds - ID(s) utilisateur(s) à analyser
   * @param currentMonth - Date du mois en cours
   * @returns Charges fixes payées et à venir avec totaux
   */
  static async getUpcomingCharges(
    userIds: UserIdsType,
    currentMonth: Date
  ): Promise<{
    paid: IDepensePopulated[];
    upcoming: Array<{
      description: string;
      montant: number;
      categorie: { _id: mongoose.Types.ObjectId; nom: string };
      date: Date;
    }>;
    totalPaid: number;
    totalUpcoming: number;
  }> {
    const dateDebut = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const dateFin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Récupérer toutes les charges fixes payées du mois en cours
    const paidCharges = await DepenseModel.find({
      utilisateur: userIds,
      date: { $gte: dateDebut, $lte: dateFin },
      estChargeFixe: true,
    })
      .select("montant date categorie description typeCompte typeDepense estChargeFixe commentaire utilisateur")
      .populate({
        path: "categorie",
        select: "nom _id",
      })
      .sort({ date: 1 })
      .lean<IDepensePopulated[]>();

    // Récupérer les charges fixes du mois précédent pour identifier les récurrentes
    const moisPrecedentDebut = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const moisPrecedentFin = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

    const previousMonthCharges = await DepenseModel.find({
      utilisateur: userIds,
      date: { $gte: moisPrecedentDebut, $lte: moisPrecedentFin },
      estChargeFixe: true,
    })
      .select("montant date categorie description typeCompte typeDepense estChargeFixe commentaire utilisateur")
      .populate({
        path: "categorie",
        select: "nom _id",
      })
      .lean<IDepensePopulated[]>();

    // Identifier les charges à venir (présentes le mois dernier mais pas encore payées ce mois)
    const upcomingCharges = previousMonthCharges
      .filter((prevCharge) => {
        // Vérifier si cette charge n'a pas encore été payée ce mois
        const alreadyPaid = paidCharges.some(
          (paidCharge) =>
            paidCharge.categorie._id.toString() === prevCharge.categorie._id.toString() &&
            paidCharge.description === prevCharge.description
        );
        return !alreadyPaid;
      })
      .map((charge) => {
        // Estimer la date attendue (même jour du mois que le mois précédent)
        const prevDate = new Date(charge.date);
        const expectedDay = Math.min(prevDate.getDate(), dateFin.getDate());
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), expectedDay);

        return {
          description: charge.description || "Charge fixe",
          montant: charge.montant,
          categorie: charge.categorie,
          date,
        };
      });

    const totalPaid = paidCharges.reduce((acc, charge) => acc + charge.montant, 0);
    const totalUpcoming = upcomingCharges.reduce((acc, charge) => acc + charge.montant, 0);

    return {
      paid: paidCharges,
      upcoming: upcomingCharges,
      totalPaid,
      totalUpcoming,
    };
  }

  /**
   * Récupère les informations de la dernière synchronisation des dépenses et revenus
   * @param userIds - ID(s) utilisateur(s) à analyser
   * @returns Informations sur la dernière activité (date, jours écoulés, besoin de mise à jour)
   */
  static async getLastSync(
    userIds: UserIdsType
  ): Promise<{
    lastExpenseDate: Date | null;
    lastRevenueDate: Date | null;
    lastActivityDate: Date | null;
    daysSinceLastExpense: number | null;
    daysSinceLastRevenue: number | null;
    daysSinceLastActivity: number | null;
    needsUpdate: boolean;
  }> {
    // Récupérer la dernière dépense
    const lastExpense = await DepenseModel.findOne({
      utilisateur: userIds,
    })
      .sort({ date: -1 })
      .select("date")
      .lean();

    // Récupérer le dernier revenu
    const lastRevenue = await RevenuModel.findOne({
      utilisateur: userIds,
    })
      .sort({ date: -1 })
      .select("date")
      .lean();

    const lastExpenseDate = lastExpense?.date || null;
    const lastRevenueDate = lastRevenue?.date || null;

    // Déterminer la date d'activité la plus récente
    let lastActivityDate: Date | null = null;
    if (lastExpenseDate && lastRevenueDate) {
      lastActivityDate = lastExpenseDate > lastRevenueDate ? lastExpenseDate : lastRevenueDate;
    } else if (lastExpenseDate) {
      lastActivityDate = lastExpenseDate;
    } else if (lastRevenueDate) {
      lastActivityDate = lastRevenueDate;
    }

    // Calculer le nombre de jours écoulés
    const now = new Date();
    const daysSinceLastExpense = lastExpenseDate
      ? Math.floor((now.getTime() - new Date(lastExpenseDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceLastRevenue = lastRevenueDate
      ? Math.floor((now.getTime() - new Date(lastRevenueDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const daysSinceLastActivity = lastActivityDate
      ? Math.floor((now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Flag needsUpdate si plus de 7 jours depuis la dernière activité
    const needsUpdate = daysSinceLastActivity !== null && daysSinceLastActivity > 7;

    return {
      lastExpenseDate,
      lastRevenueDate,
      lastActivityDate,
      daysSinceLastExpense,
      daysSinceLastRevenue,
      daysSinceLastActivity,
      needsUpdate,
    };
  }

  /**
   * Récupère les tendances de dépenses par catégorie
   * @param userIds - ID(s) utilisateur
   * @param nbMois - Nombre de mois à analyser (défaut: 6)
   * @param dateReference - Date de référence (défaut: maintenant)
   * @returns Top catégories avec évolutions et tendances
   */
  static async getExpensesTrends(
    userIds: UserIdsType,
    nbMois: number = 6,
    dateReference: Date = new Date()
  ): Promise<{
    topCategories: Array<{
      categorieId: string;
      nom: string;
      totalActuel: number;
      totalPrecedent: number;
      variation: number;
      variationPourcent: number;
      tendance: 'hausse' | 'baisse' | 'stable';
    }>;
    evolutionMensuelle: Array<{
      mois: number;
      annee: number;
      categories: Array<{
        categorieId: string;
        nom: string;
        total: number;
      }>;
    }>;
  }> {
    // Période actuelle (mois en cours)
    const currentMonthStart = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Période précédente (mois précédent)
    const previousMonthStart = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // Récupérer la répartition par catégorie pour le mois actuel et précédent
    const [currentMonthData, previousMonthData] = await Promise.all([
      this.getRepartitionParCategorie(
        userIds,
        currentMonthStart,
        currentMonthEnd,
        "depense"
      ),
      this.getRepartitionParCategorie(
        userIds,
        previousMonthStart,
        previousMonthEnd,
        "depense"
      ),
    ]);

    // Créer un map pour faciliter la comparaison
    const previousMonthMap = new Map(
      previousMonthData.map((cat) => [cat._id.toString(), cat.total])
    );

    // Calculer les variations et tendances
    const topCategories = currentMonthData.map((cat) => {
      const categorieId = cat._id.toString();
      const totalActuel = cat.total;
      const totalPrecedent = previousMonthMap.get(categorieId) || 0;
      const variation = totalActuel - totalPrecedent;
      const variationPourcent =
        totalPrecedent > 0 ? (variation / totalPrecedent) * 100 : 100;

      let tendance: 'hausse' | 'baisse' | 'stable';
      if (Math.abs(variationPourcent) < 5) {
        tendance = 'stable';
      } else if (variation > 0) {
        tendance = 'hausse';
      } else {
        tendance = 'baisse';
      }

      return {
        categorieId,
        nom: cat.nom || 'Sans catégorie',
        totalActuel,
        totalPrecedent,
        variation,
        variationPourcent: Math.round(variationPourcent * 100) / 100,
        tendance,
      };
    });

    // Récupérer l'évolution mensuelle
    const evolutionMensuelle: Array<{
      mois: number;
      annee: number;
      categories: Array<{
        categorieId: string;
        nom: string;
        total: number;
      }>;
    }> = [];

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
        999
      );

      const repartition = await this.getRepartitionParCategorie(
        userIds,
        start,
        end,
        "depense"
      );

      evolutionMensuelle.push({
        mois: start.getMonth() + 1,
        annee: start.getFullYear(),
        categories: repartition.map((cat) => ({
          categorieId: cat._id.toString(),
          nom: cat.nom || 'Sans catégorie',
          total: cat.total,
        })),
      });
    }

    return {
      topCategories: topCategories.slice(0, 10), // Top 10 catégories
      evolutionMensuelle,
    };
  }
}
