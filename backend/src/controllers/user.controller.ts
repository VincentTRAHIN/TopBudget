import { AUTH, USER } from "../constants";
import { AppError } from "../middlewares/error.middleware";
import { sendSuccess, sendErrorClient } from "../utils/response.utils";
import { createAsyncHandler } from "../utils/async.utils";
import { ParsedQs } from "qs";
import { UserService } from "../services/user.service";
import logger from "../utils/logger.utils";

interface SearchUserQuery extends ParsedQs {
  query?: string;
}

export const searchUser = createAsyncHandler<
  Record<string, never>,
  Record<string, never>,
  SearchUserQuery
>(async (req, res, next): Promise<void> => {
  if (!req.user) {
    next(new AppError(AUTH.ERRORS.UNAUTHORIZED, 401));
    return;
  }

  const { query } = req.query;
  if (!query || typeof query !== "string") {
    sendErrorClient(res, USER.ERRORS.QUERY_REQUIRED);
    return;
  }

  try {
    const user = await UserService.searchUser(query);
    sendSuccess(res, USER.SUCCESS.FETCHED, user);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      if (error.statusCode === 404) {
        sendErrorClient(
          res,
          USER.ERRORS.NOT_FOUND,
          undefined,
          error.statusCode,
        );
      } else {
        sendErrorClient(res, error.message, undefined, error.statusCode);
      }
    } else {
      logger.error(
        "Erreur inattendue lors de la recherche d'utilisateur:",
        error,
      );
      next(new AppError(USER.ERRORS.SEARCH_ERROR, 500));
    }
  }
});
