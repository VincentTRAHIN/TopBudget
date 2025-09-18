/**
 * Routes pour les health checks avancés
 * Différents endpoints selon les besoins de monitoring
 */

import { Router } from 'express';
import {
  getHealthCheck,
  getQuickHealthCheck,
  getReadinessCheck,
  getLivenessCheck,
  getSimpleHealthCheck,
} from '../controllers/health.controller';

const router = Router();

// Health check complet avec détails (pour monitoring)
router.get('/', getHealthCheck);

// Health check rapide (pour load balancers)
router.get('/quick', getQuickHealthCheck);

// Readiness probe (Kubernetes)
router.get('/ready', getReadinessCheck);

// Liveness probe (Kubernetes)
router.get('/live', getLivenessCheck);

// Endpoint de compatibilité
router.get('/simple', getSimpleHealthCheck);

export default router;