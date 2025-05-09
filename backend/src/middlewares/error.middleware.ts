import { Request, Response } from 'express';
import logger from '../utils/logger.utils';

// Interface pour les erreurs personnalisées
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware de gestion des erreurs
export const errorHandler = (err: Error | AppError, req: Request, res: Response) => {
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let stack: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  logger.error(`${statusCode} - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    stack: err.stack,
  });

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(stack && { stack }),
    ...(process.env.NODE_ENV === 'development' && {
      request: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
      },
    }),
  });
}; 