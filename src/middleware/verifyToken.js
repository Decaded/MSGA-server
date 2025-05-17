/**
 * Middleware to verify JWT token from the Authorization header.
 *
 * Extracts the token from the 'Authorization' header, verifies it using the secret key,
 * and attaches the decoded user information to the request object. If the token is missing
 * or invalid, responds with a 403 status and an appropriate error message.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void}
 */
const jwt = require('jsonwebtoken');
const { env, errorMessages } = require('../config');
const { getDatabase } = require('../utils/db');

module.exports = function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) {
    return res.status(401).json({ error: errorMessages.noToken });
  }

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(400).json({ error: errorMessages.invalidTokenFormat });
  }

  const token = parts[1];
  jwt.verify(
    token,
    env.jwtSecret,
    { algorithms: ['HS256'] },
    (err, decoded) => {
      if (err)
        return res.status(403).json({ error: errorMessages.invalidToken });

      const blockedTokens = getDatabase('blockedTokens');
      if (blockedTokens[decoded.jti]) {
        return res.status(403).json({ error: errorMessages.tokenRevoked });
      }

      req.user = decoded;
      next();
    }
  );
};
