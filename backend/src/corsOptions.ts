import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'https://top-budget.vercel.app',
          'https://topbudget-api-cd9072907313.herokuapp.com'
        ];

    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

export default corsOptions;