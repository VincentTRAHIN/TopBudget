import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import User from "../models/user.model";
import mongoose from "mongoose";
import logger from "../utils/logger.utils";
import { AUTH, USER } from "../constants";
import { IUserProfileUpdateInput } from "../types/user.types";

/**
 * Mise à jour du profil utilisateur
 * @route PUT /api/profile
 * @access Privé
 */
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: AUTH.ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    // Récupérer l'ID de l'utilisateur authentifié
    const userId = req.user.id;
    
    // Récupérer les données du corps de la requête
    const { nom, email, partenaireId: partenaireIdInput } = req.body as IUserProfileUpdateInput;
    
    // Rechercher l'utilisateur actuel
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({ message: USER.ERROR_MESSAGES.USER_NOT_FOUND });
      return;
    }

    // Mise à jour du nom si fourni
    if (nom !== undefined && nom !== currentUser.nom) {
      currentUser.nom = nom;
    }

    // Mise à jour de l'email si fourni
    if (email !== undefined && email !== currentUser.email) {
      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      const emailExistant = await User.findOne({ 
        email, 
        _id: { $ne: currentUser._id } 
      });
      
      if (emailExistant) {
        res.status(400).json({ message: USER.ERROR_MESSAGES.EMAIL_ALREADY_EXISTS });
        return;
      }
      
      currentUser.email = email;
    }

    // Gestion de la liaison ou déliaison de partenaire
    if (partenaireIdInput !== undefined) {
      // Cas de la déliaison (partenaireId est null ou chaîne vide)
      if (partenaireIdInput === null || partenaireIdInput === '') {
        // Si l'utilisateur avait un partenaire, le délier
        if (currentUser.partenaireId) {
          const ancienPartenaire = await User.findById(currentUser.partenaireId);
          if (ancienPartenaire) {
            // Mettre le partenaireId de l'ancien partenaire à null
            ancienPartenaire.partenaireId = undefined;
            await ancienPartenaire.save();
          }
          
          // Mettre le partenaireId de l'utilisateur courant à null
          currentUser.partenaireId = undefined;
        }
      } else {
        // Cas de la liaison (partenaireId n'est pas null/vide)
        
        // Vérifier si partenaireIdInput est un ObjectId valide
        if (!mongoose.Types.ObjectId.isValid(partenaireIdInput)) {
          res.status(400).json({ message: "ID de partenaire invalide" });
          return;
        }
        
        // Vérifier que l'utilisateur ne tente pas de se lier à lui-même
        if (partenaireIdInput === userId) {
          res.status(400).json({ message: "Vous ne pouvez pas vous lier à vous-même" });
          return;
        }
        
        // Rechercher le partenaire potentiel
        const potentialPartner = await User.findById(partenaireIdInput);
        if (!potentialPartner) {
          res.status(404).json({ message: "Partenaire non trouvé" });
          return;
        }
        
        // Vérifier si le partenaire est déjà lié à un autre utilisateur (qui n'est pas l'utilisateur actuel)
        if (potentialPartner.partenaireId && 
            potentialPartner.partenaireId.toString() !== String(currentUser._id)) {
          res.status(400).json({ message: "Ce partenaire est déjà lié à un autre utilisateur" });
          return;
        }
        
        // Si l'utilisateur actuel était déjà lié à un autre partenaire (différent du nouveau)
        if (currentUser.partenaireId && 
            currentUser.partenaireId.toString() !== String(potentialPartner._id)) {
          // Récupérer et délier l'ancien partenaire
          const ancienPartenaire = await User.findById(currentUser.partenaireId);
          if (ancienPartenaire) {
            ancienPartenaire.partenaireId = undefined;
            await ancienPartenaire.save();
          }
        }
        
        // Lier les deux utilisateurs avec une assertion de type
        currentUser.partenaireId = potentialPartner._id as mongoose.Schema.Types.ObjectId;
        potentialPartner.partenaireId = currentUser._id as mongoose.Schema.Types.ObjectId;
        
        // Sauvegarder le partenaire
        await potentialPartner.save();
      }
    }
    
    // Sauvegarder l'utilisateur courant avec ses modifications
    await currentUser.save();
    
    // Populer le partenaire pour la réponse
    await currentUser.populate({
      path: 'partenaireId',
      select: 'nom email avatarUrl'
    });
    
    // Renvoyer une réponse avec les informations mises à jour
    res.status(200).json({
      _id: currentUser._id,
      nom: currentUser.nom,
      email: currentUser.email,
      role: currentUser.role,
      dateCreation: currentUser.dateCreation,
      avatarUrl: currentUser.avatarUrl,
      partenaireId: currentUser.partenaireId
    });
  } catch (error) {
    logger.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
  }
};

/**
 * Téléchargement d'un avatar utilisateur (stub pour le moment)
 * @route POST /api/profile/avatar
 * @access Privé
 */
export const uploadUserAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  // Cette fonction sera implémentée plus tard
  res.status(501).json({ message: "Cette fonctionnalité n'est pas encore implémentée" });
};
