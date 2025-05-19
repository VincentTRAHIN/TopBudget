import { createLogger, format, transports, transport } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

// Configuration selon l'environnement
const env = process.env.NODE_ENV || "development";
const isDevelopment = env === "development";

// Configuration de base pour les fichiers rotatifs
const rotateFileConfig = {
  dirname: "logs",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d", // Garde les logs pendant 14 jours
  maxSize: "20m", // Rotation quand le fichier atteint 20MB
};

// Format personnalisé pour les logs
const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }), // Inclut les stack traces pour les erreurs
  isDevelopment ? format.colorize() : format.uncolorize(),
  format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  }),
);

// Configuration des transports
const logTransports: transport[] = [
  // Logs de tous les niveaux
  new DailyRotateFile({
    ...rotateFileConfig,
    filename: "combined-%DATE%.log",
    level: isDevelopment ? "debug" : "info",
  }),
  // Logs d'erreurs uniquement
  new DailyRotateFile({
    ...rotateFileConfig,
    filename: "error-%DATE%.log",
    level: "error",
  }),
];

// Ajoute les logs console en développement
if (isDevelopment) {
  logTransports.push(
    new transports.Console({
      level: "debug",
    }),
  );
}

// Création du logger
const logger = createLogger({
  level: isDevelopment ? "debug" : "info",
  format: customFormat,
  transports: logTransports,
  exitOnError: false,
});

// Gestion des rejets de promesses non gérés
process.on("unhandledRejection", (reason: Error) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

// Gestion des exceptions non gérées
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

/**
 * Fonction d'aide pour logger des erreurs avec un contexte standardisé
 * @param message Message d'erreur
 * @param error Objet d'erreur
 * @param req Requête Express optionnelle
 */
export const logError = (message: string, error: Error | unknown, req?: Request | AuthRequest): void => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error(`${message}`, {
    stack: errorObj.stack,
    ...(req && {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as AuthRequest).user?.id
    })
  });
};

/**
 * Fonction d'aide pour logger des informations de service avec un format standardisé
 * @param service Nom du service
 * @param action Action effectuée
 * @param details Détails supplémentaires
 */
export const logService = (service: string, action: string, details?: Record<string, any>): void => {
  logger.info(`${service} - ${action}`, details);
};

/**
 * Fonction d'aide pour logger les requêtes HTTP
 * @param req Requête Express
 * @param duration Durée de traitement en ms
 */
export const logRequest = (req: Request | AuthRequest, duration?: number): void => {
  logger.debug(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: (req as AuthRequest).user?.id,
    ...(duration && { duration: `${duration}ms` })
  });
};

export default logger;
