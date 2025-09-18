/**
 * Tests pour le service de health checks
 */

import { healthCheckService } from '../services/health.service';
import mongoose from 'mongoose';

// Mock du config pour les tests d'environnement
jest.mock('../config/env.config', () => ({
  config: {}
}));

describe('HealthCheckService', () => {
  beforeAll(async () => {
    // Mock de mongoose pour les tests
    if (!mongoose.connection.readyState) {
      // Simulation de connexion pour les tests
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1, // connected
        writable: true,
      });
    }
  });

  describe('quickHealthCheck', () => {
    it('should return healthy status when database is connected', async () => {
      const result = await healthCheckService.quickHealthCheck();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('uptime');
      expect(result.status).toBe('healthy');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('performHealthCheck', () => {
    it('should return complete health check result', async () => {
      const result = await healthCheckService.performHealthCheck();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('checks');
      
      // Vérifier que tous les checks attendus sont présents
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks).toHaveProperty('network');
      expect(result.checks).toHaveProperty('disk');
    });

    it('should have valid check statuses', async () => {
      const result = await healthCheckService.performHealthCheck();
      
      Object.entries(result.checks).forEach(([checkName, check]) => {
        expect(['pass', 'warn', 'fail']).toContain(check.status);
        expect(check).toHaveProperty('message');
        
        if (check.duration !== undefined) {
          expect(typeof check.duration).toBe('number');
          expect(check.duration).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should return degraded status when there are warnings', async () => {
      // Mock pour simuler un warning mémoire mais autres checks OK
      const originalCheckMemory = healthCheckService['checkMemory'];
      const originalCheckEnv = healthCheckService['checkEnvironmentVariables'];
      
      healthCheckService['checkMemory'] = jest.fn().mockReturnValue({
        status: 'warn',
        message: 'High memory usage',
        details: { heapUsagePercent: 80 },
      });
      healthCheckService['checkEnvironmentVariables'] = jest.fn().mockReturnValue({
        status: 'pass',
        message: 'All required environment variables present',
        details: {},
      });

      const result = await healthCheckService.performHealthCheck();
      
      expect(result.status).toBe('degraded');
      
      // Restaurer les méthodes originales
      healthCheckService['checkMemory'] = originalCheckMemory;
      healthCheckService['checkEnvironmentVariables'] = originalCheckEnv;
    });
  });

  describe('checkReadiness', () => {
    it('should return readiness check result with critical checks only', async () => {
      const result = await healthCheckService.checkReadiness();
      
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('environment');
      
      // Les checks non-critiques ne devraient pas être présents en readiness
      expect(result.checks).not.toHaveProperty('network');
    });
  });

  describe('checkLiveness', () => {
    it('should return liveness check result with basic checks', async () => {
      const result = await healthCheckService.checkLiveness();
      
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('uptime');
    });

    it('should return warning for low uptime', async () => {
      // Mock process.uptime pour simuler un démarrage récent
      const originalUptime = process.uptime;
      process.uptime = jest.fn().mockReturnValue(15); // 15 secondes
      
      const result = await healthCheckService.checkLiveness();
      
      expect(result.checks.uptime.status).toBe('warn');
      
      // Restaurer la fonction originale
      process.uptime = originalUptime;
    });
  });

  describe('Memory check', () => {
    it('should detect high memory usage', () => {
      // Mock pour simuler une utilisation mémoire élevée
      const mockMemoryUsage = {
        rss: 500 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 85 * 1024 * 1024, // 85% d'utilisation
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      };
      
      const memoryUsageSpy = jest.spyOn(process, 'memoryUsage')
        .mockReturnValue(mockMemoryUsage);
      
      const result = healthCheckService['checkMemory']();
      
      expect(result.status).toBe('warn');
      expect(result.message).toContain('High memory usage');
      
      // Restaurer la fonction originale
      memoryUsageSpy.mockRestore();
    });

    it('should detect critical memory usage', () => {
      // Mock pour simuliser une utilisation mémoire critique
      const mockMemoryUsage = {
        rss: 500 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 91 * 1024 * 1024, // 91% d'utilisation -> plus de 90% = fail
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024,
      };
      
      const memoryUsageSpy = jest.spyOn(process, 'memoryUsage')
        .mockReturnValue(mockMemoryUsage);
      
      const result = healthCheckService['checkMemory']();
      
      expect(result.status).toBe('fail');
      expect(result.message).toContain('Critical memory usage');
      
      // Restaurer la fonction originale
      memoryUsageSpy.mockRestore();
    });
  });

  describe('Environment variables check', () => {
    it('should fail when required variables are missing', () => {
      // Sauvegarder les variables actuelles
      const originalMongo = process.env.MONGO_URI;
      const originalJWT = process.env.JWT_SECRET;
      
      // Supprimer temporairement les variables
      delete process.env.MONGO_URI;
      delete process.env.JWT_SECRET;
      
      const result = healthCheckService['checkEnvironmentVariables']();
      
      expect(result.status).toBe('fail');
      expect(result.message).toContain('Missing required environment variables');
      
      // Restaurer les variables
      if (originalMongo) process.env.MONGO_URI = originalMongo;
      if (originalJWT) process.env.JWT_SECRET = originalJWT;
    });
  });
});

describe('Health Check Integration', () => {
  it('should respond to different endpoints with appropriate formats', async () => {
    const checks = [
      healthCheckService.performHealthCheck(),
      healthCheckService.quickHealthCheck(),
      healthCheckService.checkReadiness(),
      healthCheckService.checkLiveness(),
    ];
    
    const results = await Promise.all(checks);
    
    // Tous devraient avoir un status et uptime
    results.forEach((result) => {
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('uptime');
    });
    
    // Le check complet et readiness/liveness devraient avoir plus de détails
    [results[0], results[2], results[3]].forEach((result) => {
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('checks');
    });
  });
});