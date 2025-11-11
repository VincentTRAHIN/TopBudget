/**
 * Liveness probe pour Kubernetes - Frontend
 * Vérifie que le processus Next.js est vivant
 */

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor(process.uptime());

  // Simple vérification que le processus fonctionne
  const result = {
    status: "healthy",
    timestamp,
    uptime,
    message: "Frontend process is alive",
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
