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

module.exports = function verifyToken(req, res, next) {
	const token = req.headers['authorization']?.split(' ')[1];
	if (!token) return res.status(403).json({ error: errorMessages.noToken });

	jwt.verify(token, env.jwtSecret, (err, decoded) => {
		if (err) return res.status(403).json({ error: errorMessages.invalidToken });
		req.user = decoded;
		next();
	});
};
