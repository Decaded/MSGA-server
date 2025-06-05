/**
 * Registers all route handlers and rate limiters for the application.
 *
 * @param {import('express').Express} app - The Express application instance.
 * @param {string} baseRoute - The base route prefix for all endpoints (e.g., '/api/').
 * @param {import('express-rate-limit').RateLimit} generalLimiter - Rate limiter middleware for general routes.
 * @param {import('express-rate-limit').RateLimit} authLimiter - Rate limiter middleware for authentication routes.
 *
 * @requires ./auth
 * @requires ./users
 * @requires ./works
 * @requires ./profiles
 * @requires ./webhooks
 * @requires ./version
 */

module.exports = (app, baseRoute, generalLimiter, authLimiter) => {
  const authRoutes = require('./auth');
  const userRoutes = require('./admin/users');
  const workRoutes = require('./reports/works');
  const profileRoutes = require('./reports/profiles');
  const webhookRoutes = require('./webhooks');
  const versionRoutes = require('./version');
const userAccountRoutes = require('./user/profile');



  app.use(baseRoute + 'login', authLimiter);
  app.use(baseRoute + 'register', authLimiter);

  app.use(baseRoute, authRoutes, generalLimiter);
  app.use(baseRoute + 'users', userRoutes, generalLimiter);
  app.use(baseRoute + 'works', workRoutes, generalLimiter);
  app.use(baseRoute + 'profiles', profileRoutes, generalLimiter);
  app.use(baseRoute + 'webhooks', webhookRoutes, generalLimiter);
  app.use(baseRoute + 'version', versionRoutes, generalLimiter);
  app.use(baseRoute + 'user/profile', userAccountRoutes, generalLimiter);
};
