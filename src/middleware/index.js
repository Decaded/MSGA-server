/**
 * Loads and applies middleware to the provided Express app instance.
 *
 * - Sets 'trust proxy' to 1 for correct client IP handling behind proxies.
 * - Applies security headers middleware.
 * - Enables CORS with custom options.
 * - Parses incoming JSON requests.
 * - Logs incoming requests.
 *
 * @param {import('express').Express} app - The Express application instance to configure.
 * @returns {{ authLimiter: import('express-rate-limit').RateLimit, generalLimiter: import('express-rate-limit').RateLimit }}
 *   An object containing the authentication and general rate limiters.
 */

const express = require('express');
const cors = require('cors');
const corsOptions = require('./corsConfig');
const { securityHeaders } = require('./securityHeaders');
const { authLimiter, generalLimiter } = require('./authLimiter');
const requestLogger = require('./requestLogger');

module.exports = function loadMiddleware(app) {
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(requestLogger);

  return { authLimiter, generalLimiter };
};
