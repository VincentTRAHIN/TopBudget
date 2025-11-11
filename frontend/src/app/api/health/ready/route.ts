/**
 * Readiness probe pour Kubernetes - Frontend
 * Vérifie que le frontend est prêt à recevoir du trafic
 */

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor(process.uptime());

  // Vérifications critiques pour la readiness
  const checks = {
    uptime: {
      status: uptime > 5 ? "pass" : "fail",
      message: `Application running for ${uptime} seconds`,
    },
    environment: {
      status: process.env.NODE_ENV ? "pass" : "fail",
      message: process.env.NODE_ENV ? "Environment configured" : "Environment not configured",
    },
  };

  const allPassing = Object.values(checks).every((check) => check.status === "pass");
  const status = allPassing ? "healthy" : "unhealthy";

  const result = {
    status,
    timestamp,
    uptime,
    checks,
  };

  return new Response(JSON.stringify(result), {
    status: allPassing ? 200 : 503,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
