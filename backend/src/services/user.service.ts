import UserModel from "../models/user.model";
import { USER } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import logger from "../utils/logger.utils";

export class UserService {
  /**
   * Recherche un utilisateur par email ou nom exact
   * @param query La requête de recherche (email ou nom)
   * @returns L'utilisateur trouvé
   */
  static async searchUser(query: string) {
    try {
      const searchRegex = new RegExp(`^${query.trim()}$`, "i");
      const user = await UserModel.findOne({
        $or: [{ email: searchRegex }, { nom: searchRegex }],
      }).select("_id nom email");

      if (!user) {
        throw new AppError(USER.ERRORS.NOT_FOUND, 404);
      }

      return user;
    } catch (error: unknown) {
      logger.error("Erreur lors de la recherche d'utilisateur:", error);
      throw new AppError(USER.ERRORS.SEARCH_ERROR, 500);
    }
  }
}
