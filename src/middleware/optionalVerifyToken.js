const jwt = require('jsonwebtoken');
const { env } = require('../config');
const { getDatabase } = require('../utils/db');
const { securityHeaders } = require('./securityHeaders');

module.exports = function optionalVerifyToken(req, res, next) {
  securityHeaders(req, res, () => {
    const auth = req.headers['authorization'];
    if (!auth) {
      return next(); // No token, proceed normally
    }

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(); // Malformed token, proceed normally
    }

    const token = parts[1];
    jwt.verify(
      token,
      env.jwtSecret,
      { algorithms: ['HS256'] },
      (err, decoded) => {
        if (err) {
          return next(); // Invalid token, proceed normally
        }

        const blockedTokens = getDatabase('blockedTokens');
        if (blockedTokens[decoded.jti]) {
          return next(); // Revoked token, proceed normally
        }

        // Valid token found - attach user to request
        req.user = decoded;
        next();
      }
    );
  });
};
