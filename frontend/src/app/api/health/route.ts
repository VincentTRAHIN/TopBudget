/**
 * Health check endpoint pour Next.js
 * Vérifie l'état du frontend et sa connectivité au backend
 */
import { API_BASE_URL } from "@/services/api.service";

interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: "pass" | "fail" | "warn";
      message?: string;
      duration?: number;
      details?: Record<string, unknown>;
    };
  };
}

/**
 * Vérifie la connectivité au backend API
 */
async function checkBackendConnectivity(): Promise<HealthCheckResult["checks"]["backend"]> {
  const start = Date.now();

  try {
    const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000");

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeout),
    });

    const duration = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      return {
        status: "pass",
        message: "Backend API accessible",
        duration,
        details: {
          status: response.status,
          backendVersion: data.version,
          backendUptime: data.uptime,
        },
      };
    } else {
      return {
        status: "fail",
        message: `Backend API returned ${response.status}`,
        duration,
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    }
  } catch (error) {
    return {
      status: "fail",
      message: "Backend API unreachable",
      duration: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Vérifie les variables d'environnement du frontend
 */
function checkEnvironmentVariables(): HealthCheckResult["checks"]["environment"] {
  const requiredVars = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_DEFAULT_LOCALE"];

  const missingVars: string[] = [];

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value === "") {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    return {
      status: "fail",
      message: `Missing required environment variables: ${missingVars.join(", ")}`,
      details: {
        missing: missingVars,
      },
    };
  }

  return {
    status: "pass",
    message: "All required environment variables present",
    details: {
      apiUrl: API_BASE_URL,
      environment: process.env.NODE_ENV || "development",
    },
  };
}

/**
 * Vérifie l'utilisation mémoire du processus Next.js
 */
function checkMemoryUsage(): HealthCheckResult["checks"]["memory"] {
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  let status: "pass" | "warn" | "fail" = "pass";
  let message = "Memory usage normal";

  if (heapUsagePercent > 85) {
    status = "fail";
    message = "Critical memory usage";
  } else if (heapUsagePercent > 70) {
    status = "warn";
    message = "High memory usage";
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
 * Détermine le statut global
 */
function determineOverallStatus(checks: HealthCheckResult["checks"]): "healthy" | "unhealthy" | "degraded" {
  const statuses = Object.values(checks).map((check) => check.status);

  if (statuses.includes("fail")) {
    return "unhealthy";
  }

  if (statuses.includes("warn")) {
    return "degraded";
  }

  return "healthy";
}

/**
 * Health check complet
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor(process.uptime());
  const version = process.env.npm_package_version || "1.0.0";
  const environment = process.env.NODE_ENV || "development";

  const checks: HealthCheckResult["checks"] = {};

  // Check connectivité backend
  checks.backend = await checkBackendConnectivity();

  // Check variables d'environnement
  checks.environment = checkEnvironmentVariables();

  // Check mémoire
  checks.memory = checkMemoryUsage();

  // Check uptime
  checks.uptime = {
    status: uptime > 10 ? "pass" : "warn",
    message: `Application running for ${uptime} seconds`,
    details: { uptime },
  };

  // Statut global
  const status = determineOverallStatus(checks);

  const result: HealthCheckResult = {
    status,
    timestamp,
    uptime,
    version,
    environment,
    checks,
  };

  // Status code basé sur la santé
  const statusCode = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

  return new Response(JSON.stringify(result), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
