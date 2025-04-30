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

export default uploadCSV;