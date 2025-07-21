import swaggerJsdoc from "swagger-jsdoc";

console.log("--> [DEBUG] swagger.config.ts: Starting swagger configuration initialization...");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TopBudget API",
      version: "1.0.0",
      description: "API pour l'application de gestion de budget TopBudget",
      contact: {
        name: "Support TopBudget",
        email: "support@topbudget.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Serveur de développement",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/docs/*.docs.ts"],
};

console.log("--> [DEBUG] swagger.config.ts: Options object created, about to call swaggerJsdoc...");

let swaggerSpec: any;
try {
  console.log("--> [DEBUG] swagger.config.ts: Calling swaggerJsdoc with options...");
  swaggerSpec = swaggerJsdoc(options);
  console.log("--> [DEBUG] swagger.config.ts: swaggerJsdoc call successful.");
  console.log(`--> [DEBUG] swagger.config.ts: Generated ${Object.keys(swaggerSpec.paths || {}).length} API paths`);
  console.log(`--> [DEBUG] swagger.config.ts: Generated ${Object.keys(swaggerSpec.components?.schemas || {}).length} schemas`);
} catch (error) {
  const err = error as Error;
  console.error("--> [FATAL] swagger.config.ts: CRASH during swaggerJsdoc execution:", error);
  console.error("--> [FATAL] swagger.config.ts: Error details:", {
    name: err?.name || 'Unknown',
    message: err?.message || 'No message',
    stack: err?.stack || 'No stack trace',
  });
  // Re-throw the error so the main process knows something is wrong
  throw error;
}

console.log("--> [DEBUG] swagger.config.ts: Exporting swaggerSpec successfully.");

export { swaggerSpec };
