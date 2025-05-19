import { createLogger, format, transports, transport } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

const env = process.env.NODE_ENV || "development";
const isDevelopment = env === "development";

const rotateFileConfig = {
  dirname: "logs",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  maxSize: "20m",
};

const customFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  isDevelopment ? format.colorize() : format.uncolorize(),
  format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}]: ${message}`;
  }),
);

const logTransports: transport[] = [
  new DailyRotateFile({
    ...rotateFileConfig,
    filename: "combined-%DATE%.log",
    level: isDevelopment ? "debug" : "info",
  }),
  new DailyRotateFile({
    ...rotateFileConfig,
    filename: "error-%DATE%.log",
    level: "error",
  }),
];

if (isDevelopment) {
  logTransports.push(
    new transports.Console({
      level: "debug",
    }),
  );
}

const logger = createLogger({
  level: isDevelopment ? "debug" : "info",
  format: customFormat,
  transports: logTransports,
  exitOnError: false,
});

process.on("unhandledRejection", (reason: Error) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

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
export const logError = (
  message: string,
  error: Error | unknown,
  req?: Request | AuthRequest,
): void => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error(`${message}`, {
    stack: errorObj.stack,
    ...(req && {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as AuthRequest).user?.id,
    }),
  });
};

/**
 * Fonction d'aide pour logger des informations de service avec un format standardisé
 * @param service Nom du service
 * @param action Action effectuée
 * @param details Détails supplémentaires
 */
export const logService = (
  service: string,
  action: string,
  details?: Record<string, unknown>,
): void => {
  logger.info(`${service} - ${action}`, details);
};

/**
 * Fonction d'aide pour logger les requêtes HTTP
 * @param req Requête Express
 * @param duration Durée de traitement en ms
 */
export const logRequest = (
  req: Request | AuthRequest,
  duration?: number,
): void => {
  logger.debug(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: (req as AuthRequest).user?.id,
    ...(duration && { duration: `${duration}ms` }),
  });
};

export default logger;
