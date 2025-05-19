import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { AUTH } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { AuthInscriptionBody, AuthConnexionBody } from "../types/auth.types";
import { IUserPopulated } from "../types/user.types";

export class AuthService {
  private static generateToken(id: string): string {
    if (!process.env.JWT_SECRET) {
      throw new AppError("JWT_SECRET non défini", 500);
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: AUTH.JWT_EXPIRES_IN,
    });
  }

  static async inscription(data: AuthInscriptionBody) {
    const { nom, email, motDePasse } = data;

    const userExistant = await User.findOne({ email });
    if (userExistant) {
      throw new AppError(AUTH.ERRORS.ALREADY_EXISTS, 409);
    }

    const nouvelUtilisateur = new User({ nom, email, motDePasse });
    await nouvelUtilisateur.save();

    return {
      _id: nouvelUtilisateur._id,
      nom: nouvelUtilisateur.nom,
      email: nouvelUtilisateur.email,
      token: this.generateToken(nouvelUtilisateur._id as string),
    };
  }

  static async connexion(data: AuthConnexionBody) {
    const { email, motDePasse } = data;

    const utilisateur = await User.findOne({ email });
    if (!utilisateur) {
      throw new AppError(AUTH.ERRORS.INVALID_CREDENTIALS, 401);
    }

    const motDePasseValide = await utilisateur.comparerMotDePasse(motDePasse);
    if (!motDePasseValide) {
      throw new AppError(AUTH.ERRORS.INVALID_CREDENTIALS, 401);
    }

    return {
      _id: utilisateur._id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      token: this.generateToken(utilisateur._id as string),
    };
  }

  static async getMe(userId: string): Promise<IUserPopulated> {
    const utilisateur = await User.findById(userId)
      .select("-motDePasse")
      .populate<{ partenaireId: IUserPopulated['partenaireId'] }>("partenaireId", "nom email avatarUrl _id")
      .lean<IUserPopulated>();

    if (!utilisateur) {
      throw new AppError(AUTH.ERRORS.NOT_FOUND, 404);
    }

    return utilisateur;
  }
} 