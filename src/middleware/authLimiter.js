const rateLimit = require('express-rate-limit');

// 5 requests per minute on login/register to thwart brute‑force
const authLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many attempts, please try again later.'
  }
});
exports.authLimiter = authLimiter;

/**
 * Express middleware that limits each IP to 100 requests per minute.
 * Responds with a JSON error message if the rate limit is exceeded.
 *
 * @type {import('express').RequestHandler}
 */
const generalLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  }
});
exports.generalLimiter = generalLimiter;
