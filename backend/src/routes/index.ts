console.log("--> [DEBUG] app.ts: Loading route imports...");
import { Router } from "express";
import apiRouter from "./api/index";
import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "../docs/swagger.config";
import { AppError, errorHandler } from "../middlewares/error.middleware";

const router = Router();

// Routes API principales
router.use("/api", apiRouter);

// Documentation Swagger
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log("--> [DEBUG] routes/index.ts: Swagger documentation configured at /api-docs");

// Route de fallback pour les routes non trouvées (doit être AVANT l'errorHandler)
console.log("--> [DEBUG] routes/index.ts: Setting up error handling...");
router.use((_req, _res, next) => {
  next(new AppError("Route non trouvée", 404));
});

// Middleware de gestion d'erreurs globale (doit être en DERNIER)
router.use(errorHandler);
console.log("--> [DEBUG] app.ts: Error handling configured.");
export default router;
