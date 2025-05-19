/* eslint-disable @typescript-eslint/no-namespace */
 

/**
 * @deprecated Ce fichier est obsolète. Utilisez plutôt les types définis dans typed-request.ts
 * Il est conservé temporairement pour maintenir la compatibilité avec le code existant.
 * Les types dans ce fichier seront progressivement migrés vers typed-request.ts.
 */

import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { TypeCompte, TypeDepense } from "../types/depense.types";
import { TypeCompteRevenu } from "../types/revenu.types";
import { ParsedQs } from "qs";

/**
 * Interface pour les paramètres d'URL avec ID
 * @deprecated Utiliser IdParams de typed-request.ts
 */
export interface IRouteParams {
  id?: string;
}

/**
 * Types de vues communs
 * @deprecated Utiliser ViewType de typed-request.ts
 */
export type ViewType = "moi" | "partenaire" | "couple_complet";

/**
 * Namespace pour les requêtes de dépenses pour éviter les conflits de noms
 * Note: Les namespaces sont utilisés ici pour maintenir la compatibilité avec le code existant
 * et seront remplacés par des modules ES2015 dans le nouveau fichier typed-request.ts
 * @deprecated
 */
export namespace DepenseRequest {
  /**
   * Interface pour les query params des requêtes de dépenses
   * @deprecated Utiliser DepenseQueryParams de typed-request.ts
   */
  export interface Query {
    page?: string;
    limit?: string;
    categorie?: string;
    dateDebut?: string;
    dateFin?: string;
    typeCompte?: TypeCompte;
    typeDepense?: TypeDepense;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
    vue?: ViewType;
  }

  /**
   * Interface pour le corps de requête d'ajout de dépense
   * @deprecated Utiliser DepenseCreateBody de typed-request.ts
   */
  export interface AddBody {
    montant: number;
    date: string | Date;
    commentaire?: string;
    typeCompte: TypeCompte;
    typeDepense: TypeDepense;
    recurrence?: boolean;
    categorie: string;
    description?: string;
    estChargeFixe?: boolean;
  }

  /**
   * Interface pour le corps de requête de modification de dépense
   * @deprecated Utiliser DepenseUpdateBody de typed-request.ts
   */
  export interface UpdateBody {
    montant?: number;
    date?: string | Date;
    commentaire?: string;
    typeCompte?: TypeCompte;
    typeDepense?: TypeDepense;
    recurrence?: boolean;
    categorie?: string;
    description?: string;
    estChargeFixe?: boolean;
  }
}

/**
 * Namespace pour les requêtes de revenus pour éviter les conflits de noms
 * Note: Les namespaces sont utilisés ici pour maintenir la compatibilité avec le code existant
 * @deprecated
 */
export namespace RevenuRequest {
  /**
   * Interface pour les query params des requêtes de revenus
   * @deprecated Utiliser RevenuQueryParams de typed-request.ts
   */
  export interface Query {
    page?: string;
    limit?: string;
    categorieRevenu?: string;
    dateDebut?: string;
    dateFin?: string;
    typeCompte?: TypeCompteRevenu;
    estRecurrent?: string | boolean;
    search?: string;
    sortBy?: string;
    order?: "asc" | "desc";
    vue?: ViewType;
  }

  /**
   * Interface pour le corps de requête d'ajout de revenu
   * @deprecated Utiliser RevenuCreateBody de typed-request.ts
   */
  export interface AddBody {
    montant: number;
    description: string;
    date: string | Date;
    typeCompte: TypeCompteRevenu;
    commentaire?: string;
    categorieRevenu: string;
    estRecurrent?: boolean;
  }

  /**
   * Interface pour le corps de requête de modification de revenu
   * @deprecated Utiliser RevenuUpdateBody de typed-request.ts
   */
  export interface UpdateBody {
    montant?: number;
    description?: string;
    date?: string | Date;
    typeCompte?: TypeCompteRevenu;
    commentaire?: string;
    categorieRevenu?: string;
    estRecurrent?: boolean;
  }
}

/**
 * Namespace pour les requêtes de statistiques
 * Note: Les namespaces sont utilisés ici pour maintenir la compatibilité avec le code existant
 * @deprecated
 */
export namespace StatistiqueRequest {
  /**
   * Interface pour les query params des requêtes de statistiques
   * @deprecated Utiliser StatistiqueQueryParams de typed-request.ts
   */
  export interface Query {
    mois?: string;
    annee?: string;
    contexte?: string;
    dateDebut?: string;
    dateFin?: string;
    categorie?: string;
    type?: "depenses" | "revenus" | "solde";
    nbMois?: string;
    estRecurrent?: string | boolean;
    moisActuel?: string;
    anneeActuelle?: string;
    moisPrecedent?: string;
    anneePrecedente?: string;
  }
}

/**
 * Namespace pour les requêtes de catégories
 * Note: Les namespaces sont utilisés ici pour maintenir la compatibilité avec le code existant
 * @deprecated
 */
export namespace CategorieRequest {
  /**
   * Interface pour le corps de requête d'ajout de catégorie
   * @deprecated Utiliser CategorieCreateBody de typed-request.ts
   */
  export interface AddBody {
    nom: string;
    description?: string;
    image?: string;
  }

  /**
   * Interface pour le corps de requête de modification de catégorie
   * @deprecated Utiliser CategorieUpdateBody de typed-request.ts
   */
  export interface UpdateBody {
    nom?: string;
    description?: string;
    image?: string;
  }
}

/**
 * Namespace pour les requêtes de catégories de revenus
 * Note: Les namespaces sont utilisés ici pour maintenir la compatibilité avec le code existant
 * @deprecated
 */
export namespace CategorieRevenuRequest {
  /**
   * Interface pour le corps de requête d'ajout de catégorie de revenu
   * @deprecated Utiliser CategorieRevenuCreateBody de typed-request.ts
   */
  export interface AddBody {
    nom: string;
    description?: string;
    image?: string;
  }

  /**
   * Interface pour le corps de requête de modification de catégorie de revenu
   * @deprecated Utiliser CategorieRevenuUpdateBody de typed-request.ts
   */
  export interface UpdateBody {
    nom?: string;
    description?: string;
    image?: string;
  }
}

/**
 * @deprecated Utiliser DepenseQueryParams de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IDepenseQueryParams = DepenseRequest.Query;

/**
 * @deprecated Utiliser DepenseCreateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IDepenseAddBody = DepenseRequest.AddBody;

/**
 * @deprecated Utiliser DepenseUpdateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IDepenseUpdateBody = DepenseRequest.UpdateBody;

/**
 * @deprecated Utiliser RevenuQueryParams de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IRevenuQueryParams = RevenuRequest.Query;

/**
 * @deprecated Utiliser RevenuCreateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IRevenuAddBody = RevenuRequest.AddBody;

/**
 * @deprecated Utiliser RevenuUpdateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IRevenuUpdateBody = RevenuRequest.UpdateBody;

/**
 * @deprecated Utiliser StatistiqueQueryParams de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type IStatistiquesQueryParams = StatistiqueRequest.Query;

/**
 * @deprecated Utiliser CategorieCreateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type ICategorieAddBody = CategorieRequest.AddBody;

/**
 * @deprecated Utiliser CategorieUpdateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type ICategorieUpdateBody = CategorieRequest.UpdateBody;

/**
 * @deprecated Utiliser CategorieRevenuCreateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type ICategorieRevenuAddBody = CategorieRevenuRequest.AddBody;

/**
 * @deprecated Utiliser CategorieRevenuUpdateBody de typed-request.ts
 * Maintenue pour compatibilité avec le code existant
 */
export type ICategorieRevenuUpdateBody = CategorieRevenuRequest.UpdateBody;

/**
 * Interface pour les requêtes authentifiées avec typage fort
 *
 * Permet de typer fortement les objets req.body, req.params, et req.query
 *
 * @template B - Type du body (req.body)
 * @template P - Type des paramètres d'URL (req.params)
 * @template Q - Type des paramètres de requête (req.query)
 * @deprecated Utilisez TypedAuthRequest de typed-request.ts
 */
export interface TypedRequest<
  B = Record<string, unknown>,
  P extends ParamsDictionary = ParamsDictionary,
  Q = ParsedQs,
> extends Request<P, unknown, B, Q> {
  user?: { id: string; name: string; email: string };
}
