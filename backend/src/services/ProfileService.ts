import mongoose from "mongoose";
import User from "../models/user.model";
import { IUserProfileUpdateInput, IUserPopulated } from "../types/user.types";
import { AUTH, USER } from "../constants";
import path from "path";
import fs from "fs/promises";
import { AppError } from "../middlewares/error.middleware";

class ProfileService {
  async updateUserProfileData(userId: string, data: IUserProfileUpdateInput) {
    const { nom, email, partenaireId: partenaireIdInput } = data;
    const currentUser = await User.findById(userId);
    if (!currentUser) throw new AppError(USER.ERROR_MESSAGES.USER_NOT_FOUND, 404);

    if (nom !== undefined && nom !== currentUser.nom) {
      currentUser.nom = nom;
    }

    if (email !== undefined && email !== currentUser.email) {
      const emailExistant = await User.findOne({ email, _id: { $ne: currentUser._id } });
      if (emailExistant) throw new AppError(USER.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, 400);
      currentUser.email = email;
    }

    if (partenaireIdInput !== undefined) {
      if (partenaireIdInput === null || partenaireIdInput === "") {
        if (currentUser.partenaireId) {
          const ancienPartenaire = await User.findById(currentUser.partenaireId);
          if (ancienPartenaire) {
            ancienPartenaire.partenaireId = undefined;
            await ancienPartenaire.save();
          }
          currentUser.partenaireId = undefined;
        }
      } else {
        if (!mongoose.Types.ObjectId.isValid(partenaireIdInput)) {
          throw new AppError("ID de partenaire invalide", 400);
        }
        if (partenaireIdInput === userId) {
          throw new AppError("Vous ne pouvez pas vous lier à vous-même", 400);
        }
        const potentialPartner = await User.findById(partenaireIdInput);
        if (!potentialPartner) throw new AppError("Partenaire non trouvé", 404);
        if (potentialPartner.partenaireId && potentialPartner.partenaireId.toString() !== String(currentUser._id)) {
          throw new AppError("Ce partenaire est déjà lié à un autre utilisateur", 400);
        }
        if (currentUser.partenaireId && currentUser.partenaireId.toString() !== String(potentialPartner._id)) {
          const ancienPartenaire = await User.findById(currentUser.partenaireId);
          if (ancienPartenaire) {
            ancienPartenaire.partenaireId = undefined;
            await ancienPartenaire.save();
          }
        }
        currentUser.partenaireId = potentialPartner._id as mongoose.Schema.Types.ObjectId;
        potentialPartner.partenaireId = currentUser._id as mongoose.Schema.Types.ObjectId;
        await potentialPartner.save();
      }
    }
    await currentUser.save();
    await currentUser.populate<{ partenaireId: IUserPopulated['partenaireId'] }>({ 
      path: "partenaireId", 
      select: "nom email avatarUrl" 
    });
    
    const userPopulated = currentUser as unknown as IUserPopulated;
    const { _id, nom, email, role, dateCreation, avatarUrl, partenaireId } = userPopulated;
    
    return {
      _id,
      nom,
      email,
      role,
      dateCreation,
      avatarUrl,
      partenaireId,
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new AppError("Aucun fichier fourni", 400);
    const uploadDir = path.join(__dirname, "../../public/uploads/avatars");
    await fs.mkdir(uploadDir, { recursive: true });
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
    };
    const ext = mimeToExt[file.mimetype];
    if (!ext) throw new AppError("Type de fichier non supporté", 400);
    const fileName = `user-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    const apiBaseUrl = process.env.API_BASE_URL || "http://backend:5001";
    const fileUrl = `${apiBaseUrl}/uploads/avatars/${fileName}`;
    await fs.writeFile(filePath, file.buffer);
    const user = await User.findById(userId);
    if (!user) throw new AppError("Utilisateur non trouvé", 404);
    user.avatarUrl = fileUrl;
    await user.save();
    await user.populate<{ partenaireId: IUserPopulated['partenaireId'] }>({ 
      path: "partenaireId", 
      select: "nom email avatarUrl" 
    });
    
    const userPopulated = user as unknown as IUserPopulated;
    const { _id, nom, email, role, dateCreation, avatarUrl, partenaireId } = userPopulated;
    
    return {
      _id,
      nom,
      email,
      role,
      dateCreation,
      avatarUrl,
      partenaireId,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError("Tous les champs sont requis.", 400);
    }
    if (newPassword !== confirmPassword) {
      throw new AppError("Les nouveaux mots de passe ne correspondent pas.", 400);
    }
    const rules = AUTH.PASSWORD_RULES;
    if (
      newPassword.length < rules.MIN_LENGTH ||
      (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(newPassword)) ||
      (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(newPassword)) ||
      (rules.REQUIRE_NUMBER && !/[0-9]/.test(newPassword)) ||
      (rules.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword))
    ) {
      throw new AppError("Le nouveau mot de passe ne respecte pas les règles de sécurité.", 400);
    }
    const user = await User.findById(userId);
    if (!user) throw new AppError(USER.ERROR_MESSAGES.USER_NOT_FOUND, 404);
    const isMatch = await user.comparerMotDePasse(currentPassword);
    if (!isMatch) throw new AppError("Mot de passe actuel incorrect.", 401);
    user.motDePasse = newPassword;
    await user.save();
    return { message: "Mot de passe mis à jour avec succès." };
  }
}

export default new ProfileService();
