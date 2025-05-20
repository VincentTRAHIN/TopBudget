import { createLogger, format, transports, transport } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Request } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

const env = process.env.NODE_ENV || "development";
const isDevelopment = env === "development";

const { combine, timestamp, json, printf, colorize, align, errors } = format;

const rotateFileConfig = {
  dirname: "logs",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  maxSize: "20m",
};

const devFormat = combine(
  colorize({ 
    colors: { 
      info: 'blue', 
      http: 'magenta', 
      debug: 'green' // Optionnel, pour différencier de info/http si besoin
      // les autres niveaux (error, warn) prendront leurs couleurs par défaut (rouge, jaune)
    } 
  }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  align(),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, service, method, ...meta }) => {
    let log = `[${ts}] ${level}`;
    if (service) log += ` [${service}]`;
    if (method) log += ` [${method}]`;
    log += `: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    const filteredMeta = { ...meta };
    // Supprime les clés déjà affichées pour éviter la redondance dans meta
    ['level', 'message', 'timestamp', 'stack', 'service', 'method'].forEach(key => {
      const metaKey = key as keyof typeof filteredMeta;
      delete filteredMeta[metaKey];
    });
    if (Object.keys(filteredMeta).length > 0) {
      log += `\n  meta: ${JSON.stringify(filteredMeta, null, 2)}`;
    }
    return log;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
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
  format: isDevelopment ? devFormat : prodFormat,
  transports: logTransports,
  exceptionHandlers: [
    new DailyRotateFile({
      ...rotateFileConfig,
      filename: "exceptions-%DATE%.log",
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      ...rotateFileConfig,
      filename: "rejections-%DATE%.log",
    }),
  ],
  exitOnError: false,
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
 * @param method Nom de la méthode appelée
 * @param details Détails supplémentaires en tant qu'objet de métadonnées
 */
export const logService = (
  service: string,
  method: string,
  details?: Record<string, unknown>,
): void => {
  logger.debug(`Appel de la méthode ${method} dans le service ${service}`, { 
    service,
    method,
    ...details 
  });
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
