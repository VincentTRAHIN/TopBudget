import mongoose from "mongoose";
import DepenseModel from "../models/depense.model";
import UserModel from "../models/user.model";
import CategorieModel from "../models/categorie.model";
import { AppError } from "../middlewares/error.middleware";
import { DEPENSE, AUTH } from "../constants";
import {
  TypeCompteEnum,
  TypeDepense,
  IDepensePopulated,
} from "../types/depense.types";
import { IUser } from "../types/user.types";
import {
  DepenseCreateBody,
  DepenseUpdateBody,
  DepenseQueryParams,
} from "../types/typed-request";

export class DepenseService {
  private static buildDepenseQuery(
    query: DepenseQueryParams,
  ): Record<string, unknown> {
    const matchFilter: Record<string, unknown> = {};

    const { categorie, dateDebut, dateFin, typeCompte, typeDepense, search } =
      query;

    if (
      typeof typeDepense === "string" &&
      typeDepense &&
      Object.values(DEPENSE.TYPES_DEPENSE).includes(typeDepense as TypeDepense)
    ) {
      matchFilter.typeDepense = typeDepense;
    }

    if (
      typeof categorie === "string" &&
      categorie &&
      mongoose.Types.ObjectId.isValid(categorie)
    ) {
      matchFilter.categorie = new mongoose.Types.ObjectId(categorie);
    }

    if (dateDebut || dateFin) {
      matchFilter.date = {};
      if (dateDebut) {
        (matchFilter.date as Record<string, Date>)["$gte"] = new Date(
          dateDebut,
        );
      }
      if (dateFin) {
        (matchFilter.date as Record<string, Date>)["$lte"] = new Date(dateFin);
      }
    }

    if (
      typeof typeCompte === "string" &&
      typeCompte &&
      Object.values(DEPENSE.TYPES_COMPTE).includes(typeCompte as TypeCompteEnum)
    ) {
      matchFilter.typeCompte = typeCompte;
    }

    if (typeof search === "string" && search.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      matchFilter.$or = [{ description: regex }, { commentaire: regex }];
    }

    return matchFilter;
  }

  static async create(data: DepenseCreateBody, userId: string) {
    const {
      montant,
      date,
      commentaire,
      typeCompte,
      typeDepense,
      recurrence,
      categorie,
      description,
      estChargeFixe,
    } = data;

    const categorieExiste = await CategorieModel.findById(categorie)
      .select("_id")
      .lean();
    if (!categorieExiste) {
      throw new AppError(DEPENSE.ERRORS.CATEGORIE_NOT_FOUND, 404);
    }

    const nouvelleDepense = new DepenseModel({
      montant,
      date,
      commentaire,
      typeCompte,
      typeDepense,
      recurrence,
      categorie,
      description,
      estChargeFixe: Boolean(estChargeFixe),
      utilisateur: userId,
    });

    await nouvelleDepense.save();

    return DepenseModel.findById(nouvelleDepense._id)
      .select("montant date categorie description utilisateur typeCompte typeDepense estChargeFixe commentaire recurrence")
      .populate<{
        categorie: IDepensePopulated["categorie"];
      }>({
        path: "categorie",
        select: "nom description image _id"
      })
      .populate<{
        utilisateur: IDepensePopulated["utilisateur"];
      }>({
        path: "utilisateur",
        select: "nom _id"
      })
      .lean<IDepensePopulated>();
  }

  static async getAll(params: DepenseQueryParams, userId: string) {
    const page = parseInt(params.page as string) || 1;
    const limit = parseInt(params.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { sortBy = "date", order = "desc", vue = "moi" } = params;

    const queryFilters = this.buildDepenseQuery(params);
    const userIdsToQuery: mongoose.Types.ObjectId[] = [];

    if (vue === "moi") {
      userIdsToQuery.push(new mongoose.Types.ObjectId(userId));
    } else if (vue === "partenaire") {
      const currentUser = await UserModel.findById(userId)
        .select("partenaireId")
        .lean();
      if (currentUser?.partenaireId) {
        const partenaireId =
          typeof currentUser.partenaireId === "string"
            ? new mongoose.Types.ObjectId(currentUser.partenaireId)
            : new mongoose.Types.ObjectId(currentUser.partenaireId.toString());
        userIdsToQuery.push(partenaireId);
      } else {
        return {
          depenses: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }
    } else if (vue === "couple_complet") {
      userIdsToQuery.push(new mongoose.Types.ObjectId(userId));
      const currentUser = await UserModel.findById(userId)
        .select("partenaireId")
        .lean();
      if (currentUser?.partenaireId) {
        const partenaireId =
          typeof currentUser.partenaireId === "string"
            ? new mongoose.Types.ObjectId(currentUser.partenaireId)
            : new mongoose.Types.ObjectId(currentUser.partenaireId.toString());
        userIdsToQuery.push(partenaireId);
      }
    } else {
      userIdsToQuery.push(new mongoose.Types.ObjectId(userId));
    }

    queryFilters.utilisateur = { $in: userIdsToQuery };

    const total = await DepenseModel.countDocuments(queryFilters);
    const pages = Math.ceil(total / limit);

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy as string] = order === "asc" ? 1 : -1;

    const depenses = await DepenseModel.find(queryFilters)
      .select("montant date categorie description utilisateur typeCompte typeDepense estChargeFixe commentaire recurrence")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate<{
        categorie: IDepensePopulated["categorie"];
      }>({
        path: "categorie",
        select: "nom description image _id"
      })
      .populate<{ utilisateur: Pick<IUser, "nom" | "_id"> }>({
        path: "utilisateur",
        select: "nom _id"
      })
      .lean<IDepensePopulated[]>();

    return {
      depenses,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  }

  static async getById(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(DEPENSE.ERRORS.INVALID_ID, 400);
    }

    const depense = await DepenseModel.findById(id)
      .select("montant date categorie description utilisateur typeCompte typeDepense estChargeFixe commentaire recurrence")
      .populate<{
        categorie: IDepensePopulated["categorie"];
      }>({
        path: "categorie",
        select: "nom description image _id"
      })
      .populate<{
        utilisateur: IDepensePopulated["utilisateur"];
      }>({
        path: "utilisateur",
        select: "nom email _id"
      })
      .lean<IDepensePopulated>();

    if (!depense) {
      throw new AppError(DEPENSE.ERRORS.NOT_FOUND, 404);
    }

    const utilisateurId = userId.toString();
    const depenseUtilisateurId = (
      depense.utilisateur as { _id: mongoose.Types.ObjectId }
    )._id.toString();

    let hasAccess = utilisateurId === depenseUtilisateurId;

    if (!hasAccess) {
      const currentUser = await UserModel.findById(userId)
        .select("partenaireId")
        .lean();
      if (currentUser?.partenaireId) {
        const partenaireId = currentUser.partenaireId.toString();
        hasAccess = partenaireId === depenseUtilisateurId;
      }
    }

    if (!hasAccess) {
      throw new AppError(AUTH.ERRORS.UNAUTHORIZED, 403);
    }

    return depense;
  }

  static async update(id: string, data: DepenseUpdateBody, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(DEPENSE.ERRORS.INVALID_ID, 400);
    }

    const depense = await DepenseModel.findOne({
      _id: id,
      utilisateur: userId,
    });
    if (!depense) {
      throw new AppError(DEPENSE.ERRORS.NOT_FOUND, 404);
    }

    if (data.categorie) {
      const categorieExiste = await CategorieModel.findById(data.categorie)
        .select("_id")
        .lean();
      if (!categorieExiste) {
        throw new AppError(DEPENSE.ERRORS.CATEGORIE_NOT_FOUND, 404);
      }
    }

    if (data.date && typeof data.date === "string") {
      data.date = new Date(data.date);
    }

    Object.assign(depense, data);
    await depense.save();

    return DepenseModel.findById(id)
      .select("montant date categorie description utilisateur typeCompte typeDepense estChargeFixe commentaire recurrence")
      .populate<{
        categorie: IDepensePopulated["categorie"];
      }>({
        path: "categorie",
        select: "nom description image _id"
      })
      .populate<{
        utilisateur: IDepensePopulated["utilisateur"];
      }>({
        path: "utilisateur",
        select: "nom email _id"
      })
      .lean<IDepensePopulated>();
  }

  static async delete(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(DEPENSE.ERRORS.INVALID_ID, 400);
    }

    const depense = await DepenseModel.findOne({
      _id: id,
      utilisateur: userId,
    })
      .select("_id")
      .lean();
    if (!depense) {
      throw new AppError(DEPENSE.ERRORS.NOT_FOUND, 404);
    }

    await DepenseModel.findByIdAndDelete(id);
  }
}
