import { Response } from "express";
import { ValidationError } from "express-validator";

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendErrorClient = (
  res: Response,
  message: string,
  errors?: ValidationError[] | string,
  statusCode: number = 400,
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const sendErrorServer = (
  res: Response,
  message: string,
  statusCode: number = 500,
): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
