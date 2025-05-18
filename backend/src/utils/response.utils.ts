import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Opération réussie',
  statusCode: number = 200
): void => {
  if ((data === undefined || data === null) && statusCode === 204) {
    res.sendStatus(204);
    return;
  }
  res.status(statusCode).json({ status: 'success', message, data });
};

export const sendErrorClient = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any[]
): void => {
  res.status(statusCode).json({ status: 'fail', message, ...(errors && { errors }) });
};
