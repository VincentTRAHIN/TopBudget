import mongoose from "mongoose";
import CategorieRevenu from "../models/categorieRevenu.model";
import RevenuModel from "../models/revenu.model";
import { AppError } from "../middlewares/error.middleware";
import { CATEGORIE_REVENU } from "../constants";
import {
  CategorieRevenuCreateBody,
  CategorieRevenuUpdateBody,
} from "../types/typed-request";

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
      throw new AppError(
        CATEGORIE_REVENU.ERRORS.INVALID_DESCRIPTION_LENGTH,
        400,
      );
    }
  }

  private static async checkNomExists(
    nom: string,
    userId: string,
    excludeId?: string,
  ): Promise<void> {
    const query = {
      nom: { $regex: new RegExp(`^${nom.trim()}$`, "i") },
      utilisateur: userId,
    };
    
    if (excludeId) {
      Object.assign(query, { _id: { $ne: excludeId } });
    }

    const categorieExistante = await CategorieRevenu.findOne(query);
    if (categorieExistante) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.ALREADY_EXISTS, 409);
    }
  }

  static async create(data: CategorieRevenuCreateBody, userId: string) {
    const { nom, description, image } = data;
    
    this.validateNomLength(nom);
    this.validateDescriptionLength(description);
    await this.checkNomExists(nom, userId);

    const categorieRevenu = new CategorieRevenu({
      nom: nom.trim(),
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
  
  static async getById(id: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_ID, 400);
    }

    const categorieRevenu = await CategorieRevenu.findOne({ 
      _id: id,
      utilisateur: userId 
    });
    
    if (!categorieRevenu) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.NOT_FOUND, 404);
    }

    return categorieRevenu;
  }

  static async update(
    id: string,
    data: CategorieRevenuUpdateBody,
    userId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.INVALID_ID, 400);
    }

    const categorieRevenu = await CategorieRevenu.findOne({
      _id: id,
      utilisateur: userId,
    });
    
    if (!categorieRevenu) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.NOT_FOUND, 404);
    }

    if (data.nom) {
      const nom = data.nom.trim();
      this.validateNomLength(nom);
      await this.checkNomExists(nom, userId, id);
      categorieRevenu.nom = nom;
    }

    if (data.description !== undefined) {
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

    const categorieRevenu = await CategorieRevenu.findOne({
      _id: id,
      utilisateur: userId,
    });
    
    if (!categorieRevenu) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.NOT_FOUND, 404);
    }

    const revenuCount = await RevenuModel.countDocuments({ 
      categorieRevenu: id,
      utilisateur: userId 
    });
    
    if (revenuCount > 0) {
      throw new AppError(CATEGORIE_REVENU.ERRORS.IN_USE, 400);
    }

    await categorieRevenu.deleteOne();
  }
}
