import { AuthRequest } from "../middlewares/auth.middleware";
import { Request } from "express";
import { Query, ParamsDictionary } from "express-serve-static-core";
import { TypeCompte, TypeDepense } from "../types/depense.types";
import { TypeCompteRevenu } from "../types/revenu.types";

/**
 * Interface pour les paramètres d'URL avec ID
 */
export interface IRouteParams {
  id?: string;
}

/**
 * Types de vues communs
 */
export type ViewType = 'moi' | 'partenaire' | 'couple_complet';

/**
 * Namespace pour les requêtes de dépenses pour éviter les conflits de noms
 */
export namespace DepenseRequest {
  /**
   * Interface pour les query params des requêtes de dépenses
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
    order?: 'asc' | 'desc';
    vue?: ViewType;
  }

  /**
   * Interface pour le corps de requête d'ajout de dépense
   */
  export interface AddBody {
    montant: number;
    date: string | Date;
    commentaire?: string;
    typeCompte: TypeCompte;
    typeDepense: TypeDepense;
    recurrence?: boolean;
    categorie: string; // ID MongoDB
    description?: string;
    estChargeFixe?: boolean;
  }

  /**
   * Interface pour le corps de requête de modification de dépense
   */
  export interface UpdateBody {
    montant?: number;
    date?: string | Date;
    commentaire?: string;
    typeCompte?: TypeCompte;
    typeDepense?: TypeDepense;
    recurrence?: boolean;
    categorie?: string; // ID MongoDB
    description?: string;
    estChargeFixe?: boolean;
  }
}

/**
 * Namespace pour les requêtes de revenus pour éviter les conflits de noms
 */
export namespace RevenuRequest {
  /**
   * Interface pour les query params des requêtes de revenus
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
    order?: 'asc' | 'desc';
    vue?: ViewType;
  }

  /**
   * Interface pour le corps de requête d'ajout de revenu
   */
  export interface AddBody {
    montant: number;
    description: string;
    date: string | Date;
    typeCompte: TypeCompteRevenu;
    commentaire?: string;
    categorieRevenu: string; // ID MongoDB
    estRecurrent?: boolean;
  }

  /**
   * Interface pour le corps de requête de modification de revenu
   */
  export interface UpdateBody {
    montant?: number;
    description?: string;
    date?: string | Date;
    typeCompte?: TypeCompteRevenu;
    commentaire?: string;
    categorieRevenu?: string; // ID MongoDB
    estRecurrent?: boolean;
  }
}

/**
 * Namespace pour les requêtes de statistiques
 */
export namespace StatistiqueRequest {
  /**
   * Interface pour les query params des requêtes de statistiques
   */
  export interface Query {
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
  /**
   * Interface pour le corps de requête d'ajout de catégorie
   */
  export interface AddBody {
    nom: string;
    description?: string;
    image?: string;
  }

  /**
   * Interface pour le corps de requête de modification de catégorie
   */
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
  /**
   * Interface pour le corps de requête d'ajout de catégorie de revenu
   */
  export interface AddBody {
    nom: string;
    description?: string;
    image?: string;
  }

  /**
   * Interface pour le corps de requête de modification de catégorie de revenu
   */
  export interface UpdateBody {
    nom?: string;
    description?: string;
    image?: string;
  }
}

// Interfaces de compatibilité avec le code existant (à supprimer progressivement)
export interface IDepenseQueryParams extends DepenseRequest.Query {}
export interface IDepenseAddBody extends DepenseRequest.AddBody {}
export interface IDepenseUpdateBody extends DepenseRequest.UpdateBody {}
export interface IRevenuQueryParams extends RevenuRequest.Query {}
export interface IRevenuAddBody extends RevenuRequest.AddBody {}
export interface IRevenuUpdateBody extends RevenuRequest.UpdateBody {}
export interface IStatistiquesQueryParams extends StatistiqueRequest.Query {}
export interface ICategorieAddBody extends CategorieRequest.AddBody {}
export interface ICategorieUpdateBody extends CategorieRequest.UpdateBody {}
export interface ICategorieRevenuAddBody extends CategorieRevenuRequest.AddBody {}
export interface ICategorieRevenuUpdateBody extends CategorieRevenuRequest.UpdateBody {}

/**
 * Interface pour les query params des requêtes de statistiques
 */
export interface IStatistiquesQueryParams {
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

/**
 * Interface pour le corps de requête d'ajout de catégorie
 */
export interface ICategorieAddBody {
  nom: string;
  description?: string;
  image?: string;
}

/**
 * Interface pour le corps de requête de modification de catégorie
 */
export interface ICategorieUpdateBody {
  nom?: string;
  description?: string;
  image?: string;
}

/**
 * Interface pour le corps de requête d'ajout de catégorie de revenu
 */
export interface ICategorieRevenuAddBody {
  nom: string;
  description?: string;
  image?: string;
}

/**
 * Interface pour le corps de requête de modification de catégorie de revenu
 */
export interface ICategorieRevenuUpdateBody {
  nom?: string;
  description?: string;
  image?: string;
}

/**
 * Interface pour les requêtes authentifiées avec typage fort
 * 
 * Permet de typer fortement les objets req.body, req.params, et req.query
 * 
 * @template B - Type du body (req.body)
 * @template P - Type des paramètres d'URL (req.params)
 * @template Q - Type des paramètres de requête (req.query)
 */
export interface TypedRequest<
  B = Record<string, unknown>, 
  P = IRouteParams, 
  Q = Record<string, unknown>
> extends AuthRequest {
  body: B;
  params: P;
  query: Q;
}
