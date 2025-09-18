/**
 * Configuration et validation des variables d'environnement
 * Garantit que toutes les variables requises sont présentes au démarrage
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Charger les variables d'environnement
dotenv.config();

/**
 * Schéma de validation pour les variables d'environnement
 */
const envSchema = z.object({
  // Environnement
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('5001'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Base de données
  MONGO_URI: z.string().url().optional(),
  MONGO_HOST: z.string().default('localhost'),
  MONGO_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('27017'),
  MONGO_DATABASE: z.string().min(1).default('topbudget_dev'),
  MONGO_USERNAME: z.string().optional(),
  MONGO_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(),
  JWT_SECRET_FILE: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().transform((val: string) => val === 'true').default('true'),

  // API
  API_PREFIX: z.string().default('/api'),
  BODY_LIMIT: z.string().default('10mb'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().min(1)).default('15'),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('100'),

  // Uploads
  UPLOAD_DIR: z.string().default('./public/uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().min(1)).default('5'),
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,gif,pdf'),

  // Email (optionnel)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).optional(),
  SMTP_SECURE: z.string().transform((val: string) => val === 'true').optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  // Monitoring
  DEBUG: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).pipe(z.number().min(1000)).default('30000'),
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('5000'),

  // Redis (optionnel)
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0)).optional(),
});

/**
 * Lit le contenu d'un fichier secret Docker
 */
function readDockerSecret(secretName: string): string | undefined {
  const secretPath = join('/run/secrets', secretName);
  
  if (existsSync(secretPath)) {
    try {
      return readFileSync(secretPath, 'utf8').trim();
    } catch (error) {
      console.warn(`⚠️  Impossible de lire le secret Docker: ${secretName}`, error);
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Résout les secrets depuis les fichiers Docker ou les variables d'environnement
 */
function resolveSecrets(env: any) {
  // JWT Secret
  if (env.JWT_SECRET_FILE) {
    const jwtSecret = readDockerSecret('jwt_secret');
    if (jwtSecret) {
      env.JWT_SECRET = jwtSecret;
    }
  }

  // MongoDB URI
  if (env.MONGO_URI_FILE) {
    const mongoUri = readDockerSecret('mongo_uri');
    if (mongoUri) {
      env.MONGO_URI = mongoUri;
    }
  }

  // Si pas d'URI MongoDB complète, la construire
  if (!env.MONGO_URI) {
    const auth = env.MONGO_USERNAME && env.MONGO_PASSWORD 
      ? `${env.MONGO_USERNAME}:${env.MONGO_PASSWORD}@` 
      : '';
    env.MONGO_URI = `mongodb://${auth}${env.MONGO_HOST}:${env.MONGO_PORT}/${env.MONGO_DATABASE}`;
  }

  return env;
}

/**
 * Valide et parse les variables d'environnement
 */
function validateEnvironment() {
  try {
    // Résoudre les secrets
    const resolvedEnv = resolveSecrets(process.env);
    
    // Valider avec le schéma
    const parsed = envSchema.parse(resolvedEnv);
    
    // Validations supplémentaires
    if (parsed.NODE_ENV === 'production') {
      if (!parsed.JWT_SECRET || parsed.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
      
      if (parsed.LOG_LEVEL === 'debug') {
        console.warn('⚠️  DEBUG log level in production is not recommended');
      }
    }

    // Vérifier les dépendances
    if (parsed.SMTP_HOST && (!parsed.SMTP_USER || !parsed.SMTP_PASSWORD)) {
      console.warn('⚠️  SMTP configured but missing credentials');
    }

    console.log('✅ Variables d\'environnement validées avec succès');
    console.log(`📍 Environnement: ${parsed.NODE_ENV}`);
    console.log(`🚀 Port: ${parsed.PORT}`);
    console.log(`🗄️  Base de données: ${parsed.MONGO_DATABASE}`);
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erreurs de validation des variables d\'environnement:');
      error.errors.forEach((err: z.ZodIssue) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Erreur de configuration:', error);
    }
    
    process.exit(1);
  }
}

// Type pour les variables d'environnement validées
export type EnvConfig = z.infer<typeof envSchema>;

// Valider et exporter la configuration
export const config = validateEnvironment();

// Export par défaut pour compatibilité
export default config;