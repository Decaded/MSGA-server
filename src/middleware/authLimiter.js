const rateLimit = require('../../node_modules/express-rate-limit/dist/index.d.cts');

// 5 requests per minute on login/register to thwart brute‑force
const authLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many attempts, please try again later.'
  }
});
exports.authLimiter = authLimiter;
// rate limit all other routes to 100 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  }
});
exports.generalLimiter = generalLimiter;
