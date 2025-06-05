/**
 * Middleware to limit repeated requests to authentication endpoints (login/register).
 * Allows a maximum of 5 requests per minute per IP address to prevent brute-force attacks.
 * Responds with a custom error message when the limit is exceeded.
 * 
 * @type {import('express').RequestHandler}
 */
 
/**
 * Middleware to limit general requests to the server.
 * Allows a maximum of 100 requests per minute per IP address.
 * Responds with a custom error message when the limit is exceeded.
 * 
 * @type {import('express').RequestHandler}
 */

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

const generalLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  }
});
exports.generalLimiter = generalLimiter;
