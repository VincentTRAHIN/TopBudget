/**
 * Contrôleur pour les health checks avancés
 * Expose différents types de health checks selon les besoins
 */

import { Request, Response } from 'express';
import { healthCheckService, HealthCheckResult } from '../services/health.service';
import { asyncHandler } from '../utils/async.utils';

/**
 * Health check complet - pour monitoring détaillé
 * GET /api/health
 */
export const getHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  const result: HealthCheckResult = await healthCheckService.performHealthCheck();
  
  // Status code basé sur l'état de santé
  const statusCode = result.status === 'healthy' ? 200 : 
                    result.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(result);
});

/**
 * Health check rapide - pour load balancers
 * GET /api/health/quick
 */
export const getQuickHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = await healthCheckService.quickHealthCheck();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(result);
});

/**
 * Readiness probe - pour Kubernetes
 * GET /api/health/ready
 */
export const getReadinessCheck = asyncHandler(async (req: Request, res: Response) => {
  const result: HealthCheckResult = await healthCheckService.checkReadiness();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(result);
});

/**
 * Liveness probe - pour Kubernetes  
 * GET /api/health/live
 */
export const getLivenessCheck = asyncHandler(async (req: Request, res: Response) => {
  const result: HealthCheckResult = await healthCheckService.checkLiveness();
  
  const statusCode = result.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(result);
});

/**
 * Health check simple pour compatibilité (existant)
 * GET /health
 */
export const getSimpleHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});