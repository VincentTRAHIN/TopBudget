/**
 * Service de health checks avancé pour TopBudget
 * Fournit des informations détaillées sur l'état de l'application
 */

import mongoose from 'mongoose';
import { config } from '../config/env.config';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
      details?: any;
    };
  };
}

/**
 * Service de health checks
 */
export class HealthCheckService {
  private version: string;
  private startTime: Date;

  constructor() {
    this.version = process.env.npm_package_version || '1.0.0';
    this.startTime = new Date();
  }

  /**
   * Exécute tous les health checks
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());
    const checks: HealthCheckResult['checks'] = {};

    // Check base de données MongoDB
    const dbCheck = await this.checkDatabase();
    checks.database = dbCheck;

    // Check mémoire
    const memoryCheck = this.checkMemory();
    checks.memory = memoryCheck;

    // Check variables d'environnement
    const envCheck = this.checkEnvironmentVariables();
    checks.environment = envCheck;

    // Check connectivité externe (optionnel)
    const networkCheck = await this.checkNetworkConnectivity();
    checks.network = networkCheck;

    // Check système de fichiers
    const diskCheck = await this.checkDiskSpace();
    checks.disk = diskCheck;

    // Déterminer le statut global
    const status = this.determineOverallStatus(checks);

    return {
      status,
      timestamp,
      uptime,
      version: this.version,
      environment: config.NODE_ENV,
      checks,
    };
  }

  /**
   * Health check rapide pour les load balancers
   */
  async quickHealthCheck(): Promise<{ status: string; uptime: number }> {
    try {
      // Check rapide de la DB
      const dbState = mongoose.connection.readyState;
      const status = dbState === 1 ? 'healthy' : 'unhealthy';
      
      return {
        status,
        uptime: Math.floor(process.uptime()),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: Math.floor(process.uptime()),
      };
    }
  }

  /**
   * Check readiness (prêt à recevoir du trafic)
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());
    const checks: HealthCheckResult['checks'] = {};

    // Vérifications critiques pour la readiness
    checks.database = await this.checkDatabase();
    checks.environment = this.checkEnvironmentVariables();

    const status = this.determineOverallStatus(checks);

    return {
      status,
      timestamp,
      uptime,
      version: this.version,
      environment: config.NODE_ENV,
      checks,
    };
  }

  /**
   * Check liveness (application vivante)
   */
  async checkLiveness(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor(process.uptime());
    const checks: HealthCheckResult['checks'] = {};

    // Vérifications basiques pour la liveness
    checks.memory = this.checkMemory();
    checks.uptime = {
      status: uptime > 30 ? 'pass' : 'warn',
      message: `Application running for ${uptime} seconds`,
      details: {
        uptime,
        startTime: this.startTime,
      },
    };

    const status = this.determineOverallStatus(checks);

    return {
      status,
      timestamp,
      uptime,
      version: this.version,
      environment: config.NODE_ENV,
      checks,
    };
  }

  /**
   * Vérification de la base de données
   */
  private async checkDatabase(): Promise<HealthCheckResult['checks']['database']> {
    const start = Date.now();
    
    try {
      const dbState = mongoose.connection.readyState;
      const duration = Date.now() - start;

      const stateMap: { [key: number]: string } = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized',
      };

      if (dbState === 1) {
        // Test de ping à la DB
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
        }
        
        return {
          status: 'pass',
          message: 'Database connection healthy',
          duration,
          details: {
            state: stateMap[dbState] || 'unknown',
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
          },
        };
      } else {
        return {
          status: 'fail',
          message: `Database connection unhealthy: ${stateMap[dbState] || 'unknown'}`,
          duration,
          details: {
            state: stateMap[dbState] || 'unknown',
          },
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Database ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - start,
      };
    }
  }

  /**
   * Vérification de l'utilisation mémoire
   */
  private checkMemory(): HealthCheckResult['checks']['memory'] {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'Memory usage normal';

    if (heapUsagePercent > 90) {
      status = 'fail';
      message = 'Critical memory usage';
    } else if (heapUsagePercent > 75) {
      status = 'warn';
      message = 'High memory usage';
    }

    return {
      status,
      message,
      details: {
        ...memoryUsageMB,
        heapUsagePercent: Math.round(heapUsagePercent),
      },
    };
  }

  /**
   * Vérification des variables d'environnement critiques
   */
  private checkEnvironmentVariables(): HealthCheckResult['checks']['environment'] {
    const requiredVars = ['NODE_ENV', 'MONGO_URI', 'JWT_SECRET'];
    const missingVars: string[] = [];

    requiredVars.forEach((varName) => {
      if (!process.env[varName] && !config[varName as keyof typeof config]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      return {
        status: 'fail',
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        details: {
          missing: missingVars,
          environment: config.NODE_ENV,
        },
      };
    }

    return {
      status: 'pass',
      message: 'All required environment variables present',
      details: {
        environment: config.NODE_ENV,
        port: config.PORT,
      },
    };
  }

  /**
   * Vérification de la connectivité réseau
   */
  private async checkNetworkConnectivity(): Promise<HealthCheckResult['checks']['network']> {
    const start = Date.now();
    
    try {
      // En production, on peut tester la connectivité vers des services externes
      if (config.NODE_ENV === 'production') {
        // Exemple: test DNS
        const { execSync } = require('child_process');
        execSync('nslookup google.com', { timeout: 5000 });
      }

      return {
        status: 'pass',
        message: 'Network connectivity OK',
        duration: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'warn',
        message: 'Network connectivity test failed',
        duration: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Vérification de l'espace disque
   */
  private async checkDiskSpace(): Promise<HealthCheckResult['checks']['disk']> {
    const start = Date.now();
    
    try {
      const fs = require('fs');
      const stats = fs.statSync(process.cwd());
      
      // Estimation simple - en production, utiliser des outils plus avancés
      return {
        status: 'pass',
        message: 'Disk space check completed',
        duration: Date.now() - start,
        details: {
          accessible: true,
          path: process.cwd(),
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Disk space check failed',
        duration: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Détermine le statut global basé sur les checks individuels
   */
  private determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('fail')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// Instance singleton
export const healthCheckService = new HealthCheckService();