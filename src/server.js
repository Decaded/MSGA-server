/**
 * Main server entry point for the MSGA-server application.
 *
 * - Loads environment variables from `.env`.
 * - Initializes Express app with security, CORS, JSON parsing, and logging middleware.
 * - Initializes the database and logs the result.
 * - Applies rate limiting to authentication routes.
 * - Sets up API routes for authentication, users, works, profiles, webhooks, and versioning.
 * - Handles and logs errors at both middleware and server levels.
 * - Starts the HTTP server on the configured port.
 *
 * @module server
 * @requires dotenv
 * @requires express
 * @requires cors
 * @requires ./middleware/corsConfig
 * @requires ./middleware/securityHeaders
 * @requires ./middleware/authLimiter
 * @requires ./utils/db
 * @requires ./utils/logger
 * @requires ./config
 * @requires ./routes/auth
 * @requires ./routes/users
 * @requires ./routes/works
 * @requires ./routes/profiles
 * @requires ./routes/webhooks
 * @requires ./routes/version
 */

require('dotenv').config();
const express = require('express');
const { env } = require('./config');

const logger = require('./utils/logger');
const bootstrap = require('./bootstrap');
const loadMiddleware = require('./middleware');
const loadRoutes = require('./routes');

const app = express();
const { authLimiter, generalLimiter } = loadMiddleware(app);

bootstrap();

loadRoutes(app, env.route, generalLimiter, authLimiter);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled exception', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
  res.status(500).json({ error: env.errorMessages.internalServerError });
});

const server = app.listen(env.port, () => {
  logger.info(`Server running at http://localhost:${env.port}`);
});

// Handle server errors
server.on('error', err => {
  logger.error('Server error', { error: err.message });
});
