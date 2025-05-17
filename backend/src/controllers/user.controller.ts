import { Response } from "express";
import User from "../models/user.model";
import { AUTH } from "../constants";
import { AuthRequest } from "../middlewares/auth.middleware";

// GET /api/users/search?query=...
export const searchUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }
    const { query } = req.query;
    console.log("[DEBUG] /api/users/search query param:", query);
    if (!query || typeof query !== "string") {
      res.status(400).json({ message: "Paramètre query requis" });
      return;
    }
    // Recherche par email exact OU nom exact (case insensitive)
    const searchRegex = new RegExp(`^${query.trim()}$`, "i");
    console.log("[DEBUG] /api/users/search regex:", searchRegex);
    const user = await User.findOne({
      $or: [{ email: searchRegex }, { nom: searchRegex }],
    }).select("_id nom email");
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
