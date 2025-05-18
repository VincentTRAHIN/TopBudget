import { AuthRequest } from "../middlewares/auth.middleware";
import { Request, Response, NextFunction } from "express";
import { Query, ParamsDictionary } from "express-serve-static-core";
import { TypeCompte, TypeDepense } from "./depense.types";
import { TypeCompteRevenu } from "./revenu.types";

/**
 * Interface pour les paramètres d'URL avec ID
 */
export interface IdParams extends ParamsDictionary {
  id: string;
}

/**
 * Interface générique pour les requêtes typées
 */
export interface TypedRequest<
  BodyType = any,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query
> extends Request {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
}

/**
 * Interface générique pour les requêtes authentifiées typées
 */
export interface TypedAuthRequest<
  BodyType = any,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query
> extends AuthRequest {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
}

/**
 * Types de vues communs
 */
export type ViewType = 'moi' | 'partenaire' | 'couple_complet';

/**
 * Namespace pour les requêtes de dépenses
 */
export namespace DepenseRequest {
  // Query parameters
  export interface QueryParams extends Query {
    page?: string;
    limit?: string;
    categorie?: string;
    dateDebut?: string;
    dateFin?: string;
    typeCompte?: TypeCompte;
    typeDepense?: TypeDepense;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    vue?: ViewType;
  }

  // Request body - Create
  export interface CreateBody {
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

  // Request body - Update
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
 * Namespace pour les requêtes de revenus
 */
export namespace RevenuRequest {
  // Query parameters
  export interface QueryParams extends Query {
    page?: string;
    limit?: string;
    categorieRevenu?: string;
    dateDebut?: string;
    dateFin?: string;
    typeCompte?: TypeCompteRevenu;
    estRecurrent?: string | boolean;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    vue?: ViewType;
  }

  // Request body - Create
  export interface CreateBody {
    montant: number;
    description: string;
    date: string | Date;
    typeCompte: TypeCompteRevenu;
    commentaire?: string;
    categorieRevenu: string;
    estRecurrent?: boolean;
  }

  // Request body - Update
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
 */
export namespace StatistiqueRequest {
  // Query parameters
  export interface QueryParams extends Query {
    mois?: string;
    annee?: string;
    contexte?: string;
    dateDebut?: string;
    dateFin?: string;
    categorie?: string;
    type?: 'depenses' | 'revenus' | 'solde';
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
 */
export namespace CategorieRequest {
  // Request body - Create
  export interface CreateBody {
    nom: string;
    description?: string;
    image?: string;
  }

  // Request body - Update
  export interface UpdateBody {
    nom?: string;
    description?: string;
    image?: string;
  }
}

/**
 * Namespace pour les requêtes de catégories de revenus
 */
export namespace CategorieRevenuRequest {
  // Request body - Create
  export interface CreateBody {
    nom: string;
    description?: string;
    image?: string;
  }

  // Request body - Update
  export interface UpdateBody {
    nom?: string;
    description?: string;
    image?: string;
  }
}

/**
 * Type pour les fonctions de contrôleur avec gestion des erreurs
 */
export type AsyncController<
  BodyType = any,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query
> = (
  req: TypedAuthRequest<BodyType, ParamsType, QueryType>,
  res: Response,
  next: NextFunction
) => Promise<void>;
