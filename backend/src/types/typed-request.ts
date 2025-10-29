import { AuthRequest } from "../middlewares/auth.middleware";
import { Request, Response, NextFunction } from "express";
import { Query, ParamsDictionary } from "express-serve-static-core";
import { TypeCompteEnum, TypeDepense } from "./depense.types";
import { TypeCompteRevenu } from "./revenu.types";
import mongoose from "mongoose";

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
  BodyType = unknown,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query,
> extends Request<ParamsType, unknown, BodyType, QueryType> {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
}

/**
 * Interface générique pour les requêtes authentifiées typées
 */
export interface TypedAuthRequest<
  BodyType = unknown,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query,
> extends AuthRequest {
  body: BodyType;
  params: ParamsType;
  query: QueryType;
}

/**
 * Types de vues communs
 */
export type ViewType = "moi" | "partenaire" | "couple_complet";

/**
 * Types pour les requêtes de dépenses
 */
export interface DepenseQueryParams extends Query {
  page?: string;
  limit?: string;
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  typeCompte?: TypeCompteEnum;
  typeDepense?: TypeDepense;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  vue?: ViewType;
}

export interface DepenseCreateBody {
  montant: number;
  date: Date;
  commentaire?: string;
  typeCompte: TypeCompteEnum;
  typeDepense: TypeDepense;
  recurrence?: boolean;
  categorie: mongoose.Types.ObjectId | string;
  description?: string;
  estChargeFixe?: boolean;
}

export type DepenseUpdateBody = Partial<DepenseCreateBody>;

/**
 * Types pour les requêtes de revenus
 */
export interface RevenuQueryParams extends Query {
  page?: string;
  limit?: string;
  categorieRevenu?: string;
  dateDebut?: string;
  dateFin?: string;
  typeCompte?: TypeCompteRevenu;
  estRecurrent?: string;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  vue?: ViewType;
}

export interface RevenuCreateBody {
  montant: number;
  description: string;
  date: string | Date;
  typeCompte: TypeCompteRevenu;
  commentaire?: string;
  categorieRevenu: string;
  estRecurrent?: boolean;
}

export interface RevenuUpdateBody {
  montant?: number;
  description?: string;
  date?: string | Date;
  typeCompte?: TypeCompteRevenu;
  commentaire?: string;
  categorieRevenu?: string;
  estRecurrent?: boolean;
}

/**
 * Types pour les requêtes de statistiques
 */
export interface StatistiqueQueryParams extends Query {
  mois?: string;
  annee?: string;
  contexte?: string;
  dateDebut?: string;
  dateFin?: string;
  categorie?: string;
  type?: "depenses" | "revenus" | "solde";
  nbMois?: string;
  estRecurrent?: string;
  moisActuel?: string;
  anneeActuelle?: string;
  moisPrecedent?: string;
  anneePrecedente?: string;
}

/**
 * Types pour les requêtes de catégories
 */
export interface CategorieCreateBody {
  nom: string;
  description?: string;
  image?: string;
}

export interface CategorieUpdateBody {
  nom?: string;
  description?: string;
  image?: string;
}

/**
 * Types pour les requêtes de catégories de revenus
 */
export interface CategorieRevenuCreateBody {
  nom: string;
  description?: string;
  image?: string;
}

export interface CategorieRevenuUpdateBody {
  nom?: string;
  description?: string;
  image?: string;
}

/**
 * Type pour les fonctions de contrôleur avec gestion des erreurs
 */
export type AsyncController<
  BodyType = unknown,
  ParamsType extends ParamsDictionary = ParamsDictionary,
  QueryType extends Query = Query,
> = (
  req: TypedAuthRequest<BodyType, ParamsType, QueryType>,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Types pour les requêtes d'authentification
 * Note: Ces types sont également définis dans auth.types.ts
 * TODO: Consolider les types d'authentification
 */
export interface LoginBody {
  email: string;
  motDePasse: string;
}

export interface RegisterBody {
  nom: string;
  email: string;
  motDePasse: string;
  role?: "Perso" | "Conjoint";
}

/**
 * Types pour les requêtes de profil utilisateur
 */
export interface ProfileUpdateBody {
  nom?: string;
  email?: string;
  avatarUrl?: string;
  partenaireId?: string;
  sobriquetPartenaire?: string;
}

export interface DepenseQueryParams {
  vue?: ViewType;
  categorie?: string;
  dateDebut?: string;
  dateFin?: string;
  typeCompte?: TypeCompteEnum;
  typeDepense?: TypeDepense;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}


