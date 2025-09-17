console.log("--> [DEBUG] app.ts: Loading route imports...");
import { Router } from "express";
import apiRouter from "./api";
import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "../docs/swagger.config";
import { AppError, errorHandler } from "../middlewares/error.middleware";

const router = Router();

router.use("/api", apiRouter);
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
console.log("--> [DEBUG] app.ts: Setting up error handling...");
router.use((_req, _res, next) => {
  next(new AppError("Route non trouvée", 404));
});

router.use(errorHandler);
console.log("--> [DEBUG] app.ts: Error handling configured.");
export default router;
