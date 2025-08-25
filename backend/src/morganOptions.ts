import morgan from "morgan";
import logger from "./utils/logger.utils";

const morganFormat = process.env.NODE_ENV === "development" ? "dev" : "combined";
console.log(`--> [DEBUG] app.ts: Morgan format set to: ${morganFormat}`);

const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const morganOptions = morgan(morganFormat, {
    skip: (req) => req.url === "/api/health",
    stream: morganStream,
})
  
export default morganOptions;