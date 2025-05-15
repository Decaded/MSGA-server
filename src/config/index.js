/**
 * Application configuration module.
 *
 * @module config
 *
 * @requires dotenv
 *
 * @property {Object} env - Environment variables and application settings.
 * @property {number|string} env.port - The port number the server listens on.
 * @property {string[]} env.allowedOrigins - List of allowed CORS origins.
 * @property {string} env.jwtSecret - Secret key for JWT signing.
 * @property {string} env.jwtExpiration - JWT expiration time (e.g., '1h').
 * @property {string} env.sessionSecret - Secret key for session management.
 *
 * @property {Object} errorMessages - Predefined error messages used throughout the application.
 * @property {string} errorMessages.userNotFound - Message for user not found.
 * @property {string} errorMessages.wrongPassword - Message for incorrect password.
 * @property {string} errorMessages.accountNotApproved - Message for pending account approval.
 * @property {string} errorMessages.missingFields - Message for missing required fields.
 * @property {string} errorMessages.invalidSHProfile - Message for invalid ScribbleHub profile URL.
 * @property {string} errorMessages.userExists - Message for existing username or profile URL.
 * @property {string} errorMessages.approvalRequired - Message for missing approval status.
 * @property {string} errorMessages.workUrlRequired - Message for missing work URL.
 * @property {string} errorMessages.invalidSHWorkUrl - Message for invalid ScribbleHub work URL.
 * @property {string} errorMessages.workNotFound - Message for work not found.
 * @property {string} errorMessages.noToken - Message for missing authentication token.
 * @property {string} errorMessages.invalidToken - Message for invalid or expired token.
 * @property {string} errorMessages.corsError - Message for CORS error.
 *
 * @property {Object} regexPatterns - Regular expressions for validating URLs.
 * @property {RegExp} regexPatterns.shProfile - Regex for ScribbleHub profile URLs.
 * @property {RegExp} regexPatterns.shWorkUrl - Regex for ScribbleHub work URLs.
 */

require('dotenv').config();

module.exports = {
	env: {
		port: process.env.PORT || 3000,
		allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
		jwtSecret: process.env.JWT_SECRET,
		jwtExpiration: process.env.JWT_EXPIRATION || '1h',
		sessionSecret: process.env.SESSION_SECRET,
	},
	errorMessages: {
		userNotFound: 'User not found',
		wrongPassword: 'Wrong password',
		accountNotApproved: 'Account pending approval',
		missingFields: 'Username, SH profile URL and password are required',
		invalidSHProfile: 'Invalid SH profile URL format',
		userExists: 'Username or SH profile URL already in use',
		approvalRequired: 'Approval status must be provided.',
		workUrlRequired: 'Work URL is required',
		invalidSHWorkUrl: 'Invalid ScribbleHub URL format',
		workNotFound: 'Work not found',
		noToken: 'No token provided',
		invalidToken: 'Invalid or expired token',
		corsError: 'Not allowed by CORS',
	},

	regexPatterns: {
		shProfileURLPattern: new RegExp('^https://www\\.scribblehub\\.com/profile/\\d+/[a-zA-Z0-9-_]+/?$'),
		shWorkURLPattern: new RegExp('^https://www\\.scribblehub\\.com/series/\\d+'),
	},
};
