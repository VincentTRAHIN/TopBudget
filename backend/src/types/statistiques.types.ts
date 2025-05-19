import { IDepensePopulated } from "./depense.types";
import mongoose from "mongoose";

export type UserIdsType = mongoose.Types.ObjectId | { $in: ReadonlyArray<mongoose.Types.ObjectId> };

export interface CategorieRepartition {
  readonly _id: mongoose.Types.ObjectId;
  readonly total: number;
  readonly count: number;
  readonly nom?: string;
}

export interface ComparaisonInfo {
  readonly actuel: number | SoldeInfo;
  readonly precedent: number | SoldeInfo;
  readonly difference: number;
}

export interface EvolutionFluxResult {
  readonly mois: number;
  readonly annee: number;
  readonly total?: number;
  readonly totalRevenus?: number;
  readonly totalDepenses?: number;
  readonly solde?: number;
}

export interface ContributionCouple {
  readonly utilisateurId: string;
  readonly nom: string;
  readonly totalDepenses: number;
  readonly pourcentageDepenses: number;
  readonly totalRevenus: number;
  readonly pourcentageRevenus: number;
  readonly solde: number;
}

export interface SoldeInfo {
  readonly totalRevenus: number;
  readonly totalDepenses: number;
  readonly solde: number;
}

export interface StatistiquesFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  categorie?: string;
  typeCompte?: string;
}

export interface SyntheseMensuelleCouple {
  readonly soldeGlobal: SoldeInfo;
  readonly utilisateurPrincipal: {
    readonly nom: string;
    readonly depenses: number;
    readonly revenus: number;
    readonly solde: number;
  };
  readonly partenaire: {
    readonly nom: string;
    readonly depenses: number;
    readonly revenus: number;
    readonly solde: number;
  };
  readonly ratioDependes: {
    readonly utilisateurPrincipal: number;
    readonly partenaire: number;
  };
  readonly ratioRevenus: {
    readonly utilisateurPrincipal: number;
    readonly partenaire: number;
  };
}

export interface ChargesFixesCouple {
  readonly chargesUtilisateurPrincipal: IDepensePopulated[];
  readonly chargesPartenaire: IDepensePopulated[];
  readonly totalChargesUtilisateurPrincipal: number;
  readonly totalChargesPartenaire: number;
  readonly totalChargesCouple: number;
}

export interface ContributionsCouple {
  readonly contributionsUtilisateurs: ContributionCouple[];
  readonly totalDepensesCouple: number;
  readonly totalRevenusCouple: number;
  readonly soldeCouple: number;
} 