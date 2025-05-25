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
 *
 * @property {Object} errorMessages - Predefined error messages used throughout the application.
 * @property {string} errorMessages.userNotFound - Message for user not found.
 * @property {string} errorMessages.wrongPassword - Message for incorrect password.
 * @property {string} errorMessages.accountNotApproved - Message for pending account approval.
 * @property {string} errorMessages.missingFields - Message for missing required fields.
 * @property {string} errorMessages.invalidSHProfile - Message for invalid ScribbleHub profile URL.
 * @property {string} errorMessages.userExists - Message for existing username or profile URL.
 * @property {string} errorMessages.workExists - Message for existing work URL.
 * @property {string} errorMessages.invalidStatus - Message for invalid status value.
 * @property {string} errorMessages.approvalRequired - Message for missing approval status.
 * @property {string} errorMessages.unauthorizedFieldUpdate - Message for unauthorized field update.
 * @property {string} errorMessages.onlyAdminsCanAccess - Message for unauthorized access.
 * @property {string} errorMessages.onlyAdminsCanUpdateUsers - Message for unauthorized user update.
 * @property {string} errorMessages.onlyAdminsCanDelete - Message for unauthorized delete action.
 * @property {string} errorMessages.cannotDeleteOtherAdmins - Message for admin deletion attempt.
 * @property {string} errorMessages.adminCannotDeleteSelf - Message for admin self-deletion attempt.
 * @property {string} errorMessages.workUrlRequired - Message for missing work URL.
 * @property {string} errorMessages.invalidSHWorkUrl - Message for invalid ScribbleHub work URL.
 * @property {string} errorMessages.invalidTokenFormat - Message for malformed authorization header.
 * @property {string} errorMessages.workNotFound - Message for work not found.
 * @property {string} errorMessages.noToken - Message for missing authentication token.
 * @property {string} errorMessages.invalidToken - Message for invalid or expired token.
 * @property {string} errorMessages.tokenRevoked - Message for revoked token.
 * @property {string} errorMessages.corsError - Message for CORS error.
 * @property {string} errorMessages.webhookExists - Message for existing webhook URL.
 * @property {string} errorMessages.invalidWebhookUrl - Message for invalid webhook URL.
 * @property {string} errorMessages.profileUrlRequired - Message for missing profile URL.
 * @property {string} errorMessages.invalidSHProfileUrl - Message for invalid ScribbleHub profile URL.
 * @property {string} errorMessages.profileExists - Message for existing profile report.
 *
 * @property {Object} regexPatterns - Regular expressions for validating URLs.
 * @property {RegExp} regexPatterns.shProfileURLPattern - Regex for ScribbleHub profile URLs.
 * @property {RegExp} regexPatterns.shWorkURLPattern - Regex for ScribbleHub work URLs.
 */

require('dotenv').config();

module.exports = {
  env: {
    port: process.env.PORT || 3000,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173'
    ],
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '1h'
  },

  errorMessages: {
    userNotFound: 'User not found. Please check your username.',
    wrongPassword: 'Wrong password. Please try again.',
    accountNotApproved: 'Account pending approval.',
    missingFields: 'Username, SH profile URL and password are required.',
    invalidSHProfile: 'Invalid SH profile URL format.',
    userExists: 'Username or SH profile URL already in use.',
    workExists: 'This work has already been reported.',
    invalidStatus:
      'Invalid status. Must be one of: pending_review, in_progress, confirmed, taken_down, original',
    approvalRequired: 'Approval status must be provided.',
    unauthorizedFieldUpdate: 'You are not authorized to modify this field.',
    onlyAdminsCanAccess: 'You are not authorized to access this resource.',
    onlyAdminsCanUpdateUsers: 'You are not authorized to update this user.',
    onlyAdminsCanDelete: 'You are not authorized to delete this entry.',
    cannotDeleteOtherAdmins: 'You cannot delete other admins.',
    adminCannotDeleteSelf: 'Admins cannot delete themselves.',
    workUrlRequired: 'Work URL is required.',
    invalidSHWorkUrl: 'Invalid ScribbleHub URL format.',
    workNotFound: 'Work not found. Please check the ID and try again.',
    noToken: 'No token provided. Please log in.',
    invalidToken: 'Invalid or expired token. Please log in again.',
    invalidTokenFormat: 'Malformed authorization header. Please log in again.',
    tokenRevoked: 'Token has been revoked. Please log in again.',
    corsError: 'Not allowed by CORS.',
    webhookExists: 'Webhook with this URL already exists',
    invalidWebhookURL: 'Invalid Discord webhook URL format',
    profileUrlRequired: 'Profile URL is required.',
invalidSHProfileUrl: 'Invalid ScribbleHub profile URL format.',
profileExists: 'This profile has already been reported.',
  },

  regexPatterns: {
    shProfileURLPattern:
      /^https:\/\/www\.scribblehub\.com\/profile\/\d+\/[a-zA-Z0-9-_]+\/?$/,
    shWorkURLPattern: /^https:\/\/www\.scribblehub\.com\/series\/\d+/,
    discordWebhookPattern:
      /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/i
  }
};
