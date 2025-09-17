
console.log("--> [DEBUG] app.ts: Top of file, starting imports...");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes";
import corsOptions from "./corsOptions";
import morganOptions from "./morganOptions";

console.log("--> [DEBUG] app.ts: All imports completed. Creating Express app...");
const app = express();

console.log("--> [DEBUG] app.ts: Express app created. Setting up middleware...");

app.use(helmet());
console.log("--> [DEBUG] app.ts: Helmet middleware added.");

app.use(cors(corsOptions));
console.log("--> [DEBUG] app.ts: CORS middleware added.");

app.use(express.json());
console.log("--> [DEBUG] app.ts: JSON middleware added.");

app.use(express.static("public"));
console.log("--> [DEBUG] app.ts: Static middleware added.");

app.use(morganOptions);
console.log("--> [DEBUG] app.ts: Morgan middleware added.");


console.log("--> [DEBUG] app.ts: Setting up API routes...");
app.use(router);
console.log("--> [DEBUG] app.ts: All API routes configured.");



export default app;
