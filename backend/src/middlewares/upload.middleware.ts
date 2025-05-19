import multer from "multer";
import { AppError } from "./error.middleware";
import path from "path";

// Stockage en mémoire
const storage = multer.memoryStorage();

// Extensions de fichiers CSV autorisées
const ALLOWED_CSV_EXTENSIONS = ['.csv'];
// Tailles maximales des fichiers
const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 Mo

// Filtre pour n'accepter que les fichiers CSV
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Vérification du type MIME
  const isMimeValid = file.mimetype === "text/csv";
  
  // Vérification de l'extension
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtensionValid = ALLOWED_CSV_EXTENSIONS.includes(ext);
  
  if (isMimeValid && isExtensionValid) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Type de fichier invalide. Seuls les fichiers CSV sont autorisés.",
        400,
      ),
    );
  }
};

// Configuration de Multer
const uploadCSV = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_CSV_SIZE,
  },
}).single("csvFile");

// Types d'images acceptés pour les avatars
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

const avatarFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Vérification du type MIME
  const isMimeValid = ACCEPTED_IMAGE_TYPES.includes(file.mimetype);
  
  // Vérification de l'extension
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtensionValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  
  if (isMimeValid && isExtensionValid) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Type de fichier invalide. Seules les images JPEG, PNG ou GIF sont autorisées.",
        400,
      ),
    );
  }
};

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  fileFilter: avatarFileFilter,
  limits: { 
    fileSize: MAX_AVATAR_SIZE,
  },
}).single("avatar");

export default uploadCSV;
