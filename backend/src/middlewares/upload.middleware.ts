import multer from "multer";
import { AppError } from "./error.middleware";
import path from "path";

const storage = multer.memoryStorage();

const ALLOWED_CSV_EXTENSIONS = [".csv"];
const MAX_CSV_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const isMimeValid = file.mimetype === "text/csv";

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

const uploadCSV = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_CSV_SIZE,
  },
}).single("csvFile");

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];

const avatarFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const isMimeValid = ACCEPTED_IMAGE_TYPES.includes(file.mimetype);

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
