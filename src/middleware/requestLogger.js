/**
 * Express middleware that logs incoming HTTP requests with sanitized headers and body.
 * Sensitive fields such as 'password' and 'token' in the request body are redacted.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */

const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const { authorization, 'content-type': contentType } = req.headers;
  const safeHeaders = { authorization, 'content-type': contentType };

  const safeBody = { ...req.body };
  if (safeBody.password) safeBody.password = '***REDACTED***';
  if (safeBody.token) safeBody.token = '***REDACTED***';

  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    headers: safeHeaders,
    body: safeBody
  });

  next();
};
