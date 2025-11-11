/**
 * Configuration et validation des variables d'environnement Next.js
 * Valide les variables d'environnement côté client et serveur
 */
import { API_BASE_URL, API_BASE_URL_UPLOAD } from "@/services/api.service";

/**
 * Variables d'environnement côté serveur (accès complet à process.env)
 * Ces variables ne sont jamais exposées au navigateur
 */
const serverSchema = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  HOST: process.env.HOST || "0.0.0.0",
} as const;

/**
 * Variables d'environnement côté client (préfixées par NEXT_PUBLIC_)
 * Ces variables sont exposées au navigateur
 */
const clientSchema = {
  // API
  NEXT_PUBLIC_API_URL: API_BASE_URL,
  NEXT_PUBLIC_API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),

  // Auth
  NEXT_PUBLIC_LOGIN_REDIRECT_URL: process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL || "/dashboard",
  NEXT_PUBLIC_LOGOUT_REDIRECT_URL: process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || "/",
  NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL || "300000"),

  // SWR
  NEXT_PUBLIC_SWR_REVALIDATE_INTERVAL: parseInt(process.env.NEXT_PUBLIC_SWR_REVALIDATE_INTERVAL || "30000"),
  NEXT_PUBLIC_SWR_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_SWR_TIMEOUT || "10000"),

  // Uploads
  NEXT_PUBLIC_MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5"),
  NEXT_PUBLIC_ALLOWED_AVATAR_TYPES: process.env.NEXT_PUBLIC_ALLOWED_AVATAR_TYPES || "jpg,jpeg,png,gif",
  NEXT_PUBLIC_UPLOAD_URL: API_BASE_URL_UPLOAD,

  // I18n
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fr",
  NEXT_PUBLIC_LOCALES: process.env.NEXT_PUBLIC_LOCALES || "fr,en",

  // Analytics (optionnel)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  NEXT_PUBLIC_HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID || "",

  // PWA
  NEXT_PUBLIC_PWA_ENABLED: process.env.NEXT_PUBLIC_PWA_ENABLED === "true",
  NEXT_PUBLIC_PWA_CACHE_STRATEGY: process.env.NEXT_PUBLIC_PWA_CACHE_STRATEGY || "CacheFirst",

  // App
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL || "",

  // Sécurité
  NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED === "true",

  // Business
  NEXT_PUBLIC_DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "EUR",
  NEXT_PUBLIC_SUPPORTED_CURRENCIES: process.env.NEXT_PUBLIC_SUPPORTED_CURRENCIES || "EUR,USD,CHF,GBP",
  NEXT_PUBLIC_DATE_FORMAT: process.env.NEXT_PUBLIC_DATE_FORMAT || "DD/MM/YYYY",
  NEXT_PUBLIC_NUMBER_DECIMALS: parseInt(process.env.NEXT_PUBLIC_NUMBER_DECIMALS || "2"),

  // UI
  NEXT_PUBLIC_DEFAULT_THEME: process.env.NEXT_PUBLIC_DEFAULT_THEME || "system",
  NEXT_PUBLIC_PRIMARY_COLOR: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#3B82F6",

  // Performance
  NEXT_PUBLIC_STATIC_CACHE_DURATION: parseInt(process.env.NEXT_PUBLIC_STATIC_CACHE_DURATION || "3600"),
  NEXT_PUBLIC_IMAGE_CACHE_ENABLED: process.env.NEXT_PUBLIC_IMAGE_CACHE_ENABLED !== "false",
} as const;

/**
 * Validation des variables d'environnement
 */
function validateEnvironment() {
  const errors: string[] = [];

  // Validation côté serveur
  if (!serverSchema.NODE_ENV || !["development", "test", "production"].includes(serverSchema.NODE_ENV)) {
    errors.push("NODE_ENV must be one of: development, test, production");
  }

  if (isNaN(parseInt(serverSchema.PORT)) || parseInt(serverSchema.PORT) < 1 || parseInt(serverSchema.PORT) > 65535) {
    errors.push("PORT must be a valid port number (1-65535)");
  }

  // Validation côté client
  try {
    new URL(clientSchema.NEXT_PUBLIC_API_URL);
  } catch {
    errors.push("NEXT_PUBLIC_API_URL must be a valid URL");
  }

  if (clientSchema.NEXT_PUBLIC_API_TIMEOUT < 1000) {
    errors.push("NEXT_PUBLIC_API_TIMEOUT must be at least 1000ms");
  }

  if (clientSchema.NEXT_PUBLIC_MAX_FILE_SIZE < 1 || clientSchema.NEXT_PUBLIC_MAX_FILE_SIZE > 100) {
    errors.push("NEXT_PUBLIC_MAX_FILE_SIZE must be between 1 and 100 MB");
  }

  if (!["fr", "en"].includes(clientSchema.NEXT_PUBLIC_DEFAULT_LOCALE)) {
    errors.push("NEXT_PUBLIC_DEFAULT_LOCALE must be one of: fr, en");
  }

  if (!["light", "dark", "system"].includes(clientSchema.NEXT_PUBLIC_DEFAULT_THEME as string)) {
    errors.push("NEXT_PUBLIC_DEFAULT_THEME must be one of: light, dark, system");
  }

  if (clientSchema.NEXT_PUBLIC_NUMBER_DECIMALS < 0 || clientSchema.NEXT_PUBLIC_NUMBER_DECIMALS > 4) {
    errors.push("NEXT_PUBLIC_NUMBER_DECIMALS must be between 0 and 4");
  }

  // Validation des couleurs hexadécimales
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(clientSchema.NEXT_PUBLIC_PRIMARY_COLOR)) {
    errors.push("NEXT_PUBLIC_PRIMARY_COLOR must be a valid hex color (e.g., #3B82F6)");
  }

  // Validation conditionnelle pour la production
  if (serverSchema.NODE_ENV === "production") {
    if (!clientSchema.NEXT_PUBLIC_API_URL.startsWith("https://")) {
      console.warn("⚠️  NEXT_PUBLIC_API_URL should use HTTPS in production");
    }

    if (!clientSchema.NEXT_PUBLIC_BASE_URL.startsWith("https://")) {
      console.warn("⚠️  NEXT_PUBLIC_BASE_URL should use HTTPS in production");
    }

    if (clientSchema.NEXT_PUBLIC_GA_MEASUREMENT_ID === "") {
      console.warn("⚠️  Consider setting up Google Analytics for production");
    }
  }

  if (errors.length > 0) {
    console.error("❌ Erreurs de validation des variables d'environnement:");
    errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    throw new Error("Invalid environment configuration");
  }

  console.log("✅ Variables d'environnement frontend validées avec succès");
  console.log(`📍 Environnement: ${serverSchema.NODE_ENV}`);
  console.log(`🌐 API URL: ${clientSchema.NEXT_PUBLIC_API_URL}`);
  console.log(`🎨 Thème: ${clientSchema.NEXT_PUBLIC_DEFAULT_THEME}`);
}

// Types pour TypeScript
export type ServerConfig = typeof serverSchema;
export type ClientConfig = typeof clientSchema;

/**
 * Configuration validée et typée
 */
export class EnvironmentConfig {
  public readonly server: ServerConfig;
  public readonly client: ClientConfig;

  constructor() {
    // Valider au moment de l'instanciation
    validateEnvironment();

    this.server = serverSchema;
    this.client = clientSchema;
  }

  /**
   * Vérifie si on est en mode développement
   */
  public isDevelopment(): boolean {
    return this.server.NODE_ENV === "development";
  }

  /**
   * Vérifie si on est en production
   */
  public isProduction(): boolean {
    return this.server.NODE_ENV === "production";
  }

  /**
   * Vérifie si on est en test
   */
  public isTest(): boolean {
    return this.server.NODE_ENV === "test";
  }

  /**
   * Retourne la configuration pour le côté client uniquement
   */
  public getClientConfig(): ClientConfig {
    return this.client;
  }
}

// Instance singleton de la configuration
export const env = new EnvironmentConfig();

// Export par défaut pour compatibilité
export default env;
