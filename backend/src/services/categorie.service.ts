import mongoose from "mongoose";
import CategorieModel from "../models/categorie.model";
import DepenseModel from "../models/depense.model";
import { AppError } from "../middlewares/error.middleware";
import { CATEGORIE } from "../constants";
import { ICategorieInput } from "../types/categorie.types";

export class CategorieService {
  private static validateNameLength(name: string): void {
    if (
      name.length < CATEGORIE.VALIDATION.MIN_NOM_LENGTH ||
      name.length > CATEGORIE.VALIDATION.MAX_NOM_LENGTH
    ) {
      throw new AppError(CATEGORIE.ERRORS.INVALID_NOM_LENGTH, 400);
    }
  }

  private static validateDescriptionLength(description: string): void {
    if (description.length > CATEGORIE.VALIDATION.MAX_DESCRIPTION_LENGTH) {
      throw new AppError(CATEGORIE.ERRORS.INVALID_DESCRIPTION_LENGTH, 400);
    }
  }

  private static async checkNameExists(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const query = { nom: name };
    if (excludeId) {
      Object.assign(query, {
        _id: { $ne: new mongoose.Types.ObjectId(excludeId) },
      });
    }

    const existingCategorie = await CategorieModel.findOne(query)
      .select("_id")
      .lean();
    if (existingCategorie) {
      throw new AppError(CATEGORIE.ERRORS.ALREADY_EXISTS, 409);
    }
  }

  static async create(data: ICategorieInput) {
    this.validateNameLength(data.nom);
    if (data.description) {
      this.validateDescriptionLength(data.description);
    }
    await this.checkNameExists(data.nom);

    const nouvelleCategorie = new CategorieModel(data);
    await nouvelleCategorie.save();

    return CategorieModel.findById(nouvelleCategorie._id)
      .select("nom description image")
      .lean();
  }

  static async getAll() {
    return CategorieModel.find()
      .select("nom description image")
      .sort({ nom: 1 })
      .lean();
  }

  static async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE.ERRORS.INVALID_ID, 400);
    }

    const categorie = await CategorieModel.findById(id)
      .select("nom description image")
      .lean();
    if (!categorie) {
      throw new AppError(CATEGORIE.ERRORS.NOT_FOUND, 404);
    }

    return categorie;
  }

  static async update(id: string, data: Partial<ICategorieInput>) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE.ERRORS.INVALID_ID, 400);
    }

    const categorie = await CategorieModel.findById(id);
    if (!categorie) {
      throw new AppError(CATEGORIE.ERRORS.NOT_FOUND, 404);
    }

    if (data.nom) {
      this.validateNameLength(data.nom);
      await this.checkNameExists(data.nom, id);
    }

    if (data.description) {
      this.validateDescriptionLength(data.description);
    }

    Object.assign(categorie, data);
    await categorie.save();

    return CategorieModel.findById(id)
      .select("nom description image")
      .lean();
  }

  static async delete(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE.ERRORS.INVALID_ID, 400);
    }

    const categorie = await CategorieModel.findById(id)
      .select("_id")
      .lean();
    if (!categorie) {
      throw new AppError(CATEGORIE.ERRORS.NOT_FOUND, 404);
    }

    const depensesCount = await DepenseModel.countDocuments({ categorie: id });
    if (depensesCount > 0) {
      throw new AppError(CATEGORIE.ERRORS.IN_USE, 400);
    }

    await CategorieModel.findByIdAndDelete(id);
  }
}
