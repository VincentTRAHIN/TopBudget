import { createLogger, format, transports, transport } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

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

export default logger;
