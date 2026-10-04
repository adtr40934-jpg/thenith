import _env282 from "../config/env.js";
const { env  } = _env282;

// Converts uncaught application errors into a consistent API response.
async function errorHandler(error, _request, response, _next) {
  const isDuplicate = error.code === 11000;
  const isCastError = error.name === "CastError";
  const statusCode = isDuplicate
    ? 409
    : error.statusCode ||
      (error.name === "ValidationError" || isCastError ? 400 : 500);
    const isProduction = env.NODE_ENV === "production";
  const message =
    statusCode >= 500 && isProduction
      ? "Something went wrong"
      : isDuplicate
        ? "A unique value is already in use"
        : error.message || "Something went wrong";

  const duplicateField = isDuplicate
    ? Object.keys(error.keyPattern || error.keyValue || {})[0]
    : null;

  response.status(statusCode).json({
    error: {
      code: isDuplicate
        ? duplicateField
          ? `DUPLICATE_${duplicateField.toUpperCase()}`
          : "DUPLICATE_VALUE"
        : isCastError
          ? "INVALID_ID"
          : error.code || "REQUEST_FAILED",
      message,
      details: statusCode >= 500 && isProduction ? undefined : error.details,
    },
  });
}


export default { errorHandler };
