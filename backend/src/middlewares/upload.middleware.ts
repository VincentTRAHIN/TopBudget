import multer from 'multer';
import { AppError } from './error.middleware';

// Stockage en mémoire
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les fichiers CSV
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier invalide. Seuls les fichiers CSV sont autorisés.', 400));
  }
};

// Configuration de Multer
const uploadCSV = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
}).single('csvFile');

// Multer pour l'upload d'avatar utilisateur
const avatarStorage = multer.memoryStorage();
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const avatarFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Type de fichier invalide. Seules les images JPEG, PNG ou GIF sont autorisées.', 400));
  }
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
}).single('avatar');

export default uploadCSV;