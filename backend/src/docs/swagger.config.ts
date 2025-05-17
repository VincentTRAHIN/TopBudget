import swaggerJsdoc from "swagger-jsdoc";

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

export const swaggerSpec = swaggerJsdoc(options);
