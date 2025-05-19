import mongoose from "mongoose";
import RevenuModel from "../models/revenu.model";
import UserModel from "../models/user.model";
import CategorieRevenuModel from "../models/categorieRevenu.model";
import { AppError } from "../middlewares/error.middleware";
import { REVENU, AUTH } from "../constants";
import { TypeCompteRevenu, IRevenuPopulated } from "../types/revenu.types";
import { IUser } from "../types/user.types";
import {
  RevenuCreateBody,
  RevenuUpdateBody,
  RevenuQueryParams,
} from "../types/typed-request";

export class RevenuService {
  private static buildRevenuQuery(
    params: RevenuQueryParams,
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    const {
      dateDebut,
      dateFin,
      typeCompte,
      search,
      categorieRevenu,
      estRecurrent,
    } = params;

    if (dateDebut) {
      if (!query.date) query.date = {} as { $gte?: Date; $lte?: Date };
      (query.date as { $gte?: Date; $lte?: Date }).$gte = new Date(
        dateDebut as string,
      );
    }
    if (dateFin) {
      if (!query.date) query.date = {} as { $gte?: Date; $lte?: Date };
      (query.date as { $gte?: Date; $lte?: Date }).$lte = new Date(
        dateFin as string,
      );
    }
    if (typeCompte) query.typeCompte = typeCompte as TypeCompteRevenu;
    if (categorieRevenu) query.categorieRevenu = categorieRevenu;
    if (typeof estRecurrent !== "undefined") {
      if (Array.isArray(estRecurrent)) {
        query.estRecurrent = estRecurrent[0] === "true";
      } else {
        query.estRecurrent = Boolean(estRecurrent);
      }
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [{ description: searchRegex }, { commentaire: searchRegex }];
    }
    return query;
  }

  static async create(data: RevenuCreateBody, userId: string) {
    const {
      montant,
      date,
      commentaire,
      typeCompte,
      categorieRevenu,
      description,
      estRecurrent,
    } = data;

    const categorieExiste =
      await CategorieRevenuModel.findById(categorieRevenu);
    if (!categorieExiste) {
      throw new AppError(REVENU.ERRORS.CATEGORIE_REVENU_NOT_FOUND, 404);
    }

    const nouveauRevenu = new RevenuModel({
      montant,
      date,
      commentaire,
      typeCompte,
      categorieRevenu,
      description,
      estRecurrent: Boolean(estRecurrent),
      utilisateur: userId,
    });

    await nouveauRevenu.save();

    return RevenuModel.findById(nouveauRevenu._id)
      .populate<{
        categorieRevenu: IRevenuPopulated["categorieRevenu"];
      }>("categorieRevenu", "nom description image")
      .populate<{
        utilisateur: IRevenuPopulated["utilisateur"];
      }>("utilisateur", "nom _id")
      .lean<IRevenuPopulated>();
  }

  static async getAll(params: RevenuQueryParams, userId: string) {
    const page = parseInt(params.page as string) || 1;
    const limit = parseInt(params.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { sortBy = "date", order = "desc", vue = "moi" } = params;

    const queryFilters = this.buildRevenuQuery(params);
    const userIdsToQuery: mongoose.Types.ObjectId[] = [];

    if (vue === "moi") {
      userIdsToQuery.push(new mongoose.Types.ObjectId(userId));
    } else if (vue === "partenaire") {
      const currentUser =
        await UserModel.findById(userId).select("partenaireId");
      if (currentUser?.partenaireId) {
        const partenaireId =
          typeof currentUser.partenaireId === "string"
            ? new mongoose.Types.ObjectId(currentUser.partenaireId)
            : new mongoose.Types.ObjectId(currentUser.partenaireId.toString());
        userIdsToQuery.push(partenaireId);
      } else {
        return {
          revenus: [],
          pagination: { total: 0, page, limit, pages: 0 },
        };
      }
    } else if (vue === "couple_complet") {
      userIdsToQuery.push(new mongoose.Types.ObjectId(userId));
      const currentUser =
        await UserModel.findById(userId).select("partenaireId");
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

    const total = await RevenuModel.countDocuments(queryFilters);
    const pages = Math.ceil(total / limit);

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy as string] = order === "asc" ? 1 : -1;

    const revenus = await RevenuModel.find(queryFilters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate<{
        categorieRevenu: IRevenuPopulated["categorieRevenu"];
      }>("categorieRevenu", "nom description image")
      .populate<{ utilisateur: Pick<IUser, "nom"> }>("utilisateur", "nom")
      .lean<IRevenuPopulated[]>();

    return {
      revenus,
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
      throw new AppError(REVENU.ERRORS.INVALID_ID, 400);
    }

    const revenu = await RevenuModel.findById(id)
      .populate<{
        categorieRevenu: IRevenuPopulated["categorieRevenu"];
      }>("categorieRevenu", "nom description image")
      .populate<{
        utilisateur: IRevenuPopulated["utilisateur"];
      }>("utilisateur", "nom email")
      .lean<IRevenuPopulated>();

    if (!revenu) {
      throw new AppError(REVENU.ERRORS.NOT_FOUND, 404);
    }

    const utilisateurId = userId.toString();
    const revenuUtilisateurId = (
      revenu.utilisateur as { _id: mongoose.Types.ObjectId }
    )._id.toString();

    let hasAccess = utilisateurId === revenuUtilisateurId;

    if (!hasAccess) {
      const currentUser =
        await UserModel.findById(userId).select("partenaireId");
      if (currentUser?.partenaireId) {
        const partenaireId = currentUser.partenaireId.toString();
        hasAccess = partenaireId === revenuUtilisateurId;
      }
    }

    if (!hasAccess) {
      throw new AppError(AUTH.ERRORS.UNAUTHORIZED, 403);
    }

    return revenu;
  }

  static async update(id: string, data: RevenuUpdateBody, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(REVENU.ERRORS.INVALID_ID, 400);
    }

    const revenu = await RevenuModel.findOne({ _id: id, utilisateur: userId });
    if (!revenu) {
      throw new AppError(REVENU.ERRORS.NOT_FOUND, 404);
    }

    if (data.categorieRevenu) {
      const categorieExiste = await CategorieRevenuModel.findById(
        data.categorieRevenu,
      );
      if (!categorieExiste) {
        throw new AppError(REVENU.ERRORS.CATEGORIE_REVENU_NOT_FOUND, 404);
      }
    }

    if (data.date && typeof data.date === "string") {
      data.date = new Date(data.date);
    }

    Object.assign(revenu, data);
    await revenu.save();

    return RevenuModel.findById(id)
      .populate<{
        categorieRevenu: IRevenuPopulated["categorieRevenu"];
      }>("categorieRevenu", "nom description image")
      .populate<{
        utilisateur: IRevenuPopulated["utilisateur"];
      }>("utilisateur", "nom email")
      .lean<IRevenuPopulated>();
  }

  static async delete(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(REVENU.ERRORS.INVALID_ID, 400);
    }

    const revenu = await RevenuModel.findOne({ _id: id, utilisateur: userId });
    if (!revenu) {
      throw new AppError(REVENU.ERRORS.NOT_FOUND, 404);
    }

    await revenu.deleteOne();
  }
}
