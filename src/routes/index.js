/**
 * Registers all route handlers and rate limiters for the application.
 *
 * @param {import('express').Express} app - The Express application instance.
 * @param {string} baseRoute - The base route prefix for all endpoints (e.g., '/api/').
 * @param {import('express-rate-limit').RateLimit} generalLimiter - Rate limiter middleware for general routes.
 * @param {import('express-rate-limit').RateLimit} authLimiter - Rate limiter middleware for authentication routes.
 *
 * @requires ./auth
 * @requires ./admin/users
 * @requires ./works/reports
 * @requires ./reports/profiles
 * @requires ./webhooks
 * @requires ./version
 * @requires ./user/profile
 */

module.exports = (app, baseRoute, generalLimiter, authLimiter) => {
  const authRoutes = require('./auth');
  const userRoutes = require('./admin/users');
  const workRoutes = require('./reports/works');
  const profileRoutes = require('./reports/profiles');
  const webhookRoutes = require('./webhooks');
  const versionRoutes = require('./version');
  const userAccountRoutes = require('./user/profile');

  app.use(baseRoute + 'login', authLimiter, authRoutes);
  app.use(baseRoute + 'register', authLimiter, authRoutes);

  app.use(baseRoute, generalLimiter, authRoutes);
  app.use(baseRoute + 'users', generalLimiter, userRoutes);
  app.use(baseRoute + 'works', generalLimiter, workRoutes);
  app.use(baseRoute + 'profiles', generalLimiter, profileRoutes);
  app.use(baseRoute + 'webhooks', generalLimiter, webhookRoutes);
  app.use(baseRoute + 'version', generalLimiter, versionRoutes);
  app.use(baseRoute + 'user/profile', generalLimiter, userAccountRoutes);
};
