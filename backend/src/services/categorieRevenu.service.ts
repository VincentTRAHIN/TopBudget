import CategorieRevenu from "../models/categorieRevenu.model";
import { CATEGORIE_REVENU } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { CategorieRevenuCreateBody, CategorieRevenuUpdateBody } from "../types/typed-request";
import mongoose from "mongoose";

export class CategorieRevenuService {
  private static validateNomLength(nom: string): void {
    if (
      nom.length < CATEGORIE_REVENU.VALIDATION.MIN_NOM_LENGTH ||
      nom.length > CATEGORIE_REVENU.VALIDATION.MAX_NOM_LENGTH
    ) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_NOM_LENGTH, 400);
    }
  }

  private static validateDescriptionLength(description?: string): void {
    if (
      description &&
      description.length > CATEGORIE_REVENU.VALIDATION.MAX_DESCRIPTION_LENGTH
    ) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_DESCRIPTION_LENGTH, 400);
    }
  }

  private static async checkNomExists(nom: string, userId: string, excludeId?: string): Promise<void> {
    const query = {
      nom: { $regex: new RegExp(`^${nom.trim()}$`, "i") },
      utilisateur: userId,
      ...(excludeId && { _id: { $ne: excludeId } }),
    };

    const categorieExistante = await CategorieRevenu.findOne(query);
    if (categorieExistante) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.ALREADY_EXISTS, 409);
    }
  }

  static async create(data: CategorieRevenuCreateBody, userId: string) {
    const { nom: nomInitial, description, image } = data;
    const nom = nomInitial.trim();

    this.validateNomLength(nom);
    this.validateDescriptionLength(description);
    await this.checkNomExists(nom, userId);

    const categorieRevenu = new CategorieRevenu({
      nom,
      description,
      image,
      utilisateur: userId,
    });

    await categorieRevenu.save();
    return categorieRevenu;
  }

  static async getAll(userId: string) {
    return CategorieRevenu.find({ utilisateur: userId }).sort({ nom: 1 });
  }

  static async update(id: string, data: CategorieRevenuUpdateBody, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_ID, 400);
    }
    
    const categorieRevenu = await CategorieRevenu.findOne({ _id: id, utilisateur: userId });
    if (!categorieRevenu) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.NOT_FOUND, 404);
    }

    if (data.nom) {
      const nom = data.nom.trim();
      this.validateNomLength(nom);
      await this.checkNomExists(nom, userId, id);
      categorieRevenu.nom = nom;
    }

    if (data.description) {
      this.validateDescriptionLength(data.description);
      categorieRevenu.description = data.description;
    }

    if (data.image !== undefined) {
      categorieRevenu.image = data.image;
    }

    await categorieRevenu.save();
    return categorieRevenu;
  }

  static async delete(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_ID, 400);
    }
    
    const categorieRevenu = await CategorieRevenu.findOne({ _id: id, utilisateur: userId });
    if (!categorieRevenu) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.NOT_FOUND, 404);
    }

    await categorieRevenu.deleteOne();
  }
} 