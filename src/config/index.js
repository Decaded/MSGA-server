/**
 * Application configuration module.
 *
 * Loads environment variables and exports configuration objects for use throughout the application.
 *
 * @module config
 * @requires dotenv
 *
 * @property {Object} env - Environment-specific configuration.
 * @property {number|string} env.port - The port on which the server will run (default: 3000).
 * @property {string[]} env.allowedOrigins - List of allowed CORS origins.
 * @property {string} env.jwtSecret - Secret key for JWT authentication.
 * @property {string} env.jwtExpiration - JWT expiration time (default: '1h').
 *
 * @property {Object} errorMessages - Standardized error messages used throughout the application.
 * @property {string} errorMessages.noToken - Error message for missing authentication token.
 * @property {string} errorMessages.invalidToken - Error message for invalid or expired token.
 * @property {string} errorMessages.invalidTokenFormat - Error message for malformed authorization header.
 * @property {string} errorMessages.tokenRevoked - Error message for revoked token.
 * @property {string} errorMessages.accountNotApproved - Error message for unapproved accounts.
 * @property {string} errorMessages.wrongPassword - Error message for incorrect password.
 * @property {string} errorMessages.userNotFound - Error message for non-existent user.
 * @property {string} errorMessages.missingFields - Error message for missing required fields.
 * @property {string} errorMessages.userExists - Error message for duplicate user or profile.
 * @property {string} errorMessages.onlyAdminsCanAccess - Error message for unauthorized resource access.
 * @property {string} errorMessages.onlyAdminsCanUpdateUsers - Error message for unauthorized user update.
 * @property {string} errorMessages.onlyAdminsCanDelete - Error message for unauthorized deletion.
 * @property {string} errorMessages.cannotDeleteOtherAdmins - Error message for attempting to delete other admins.
 * @property {string} errorMessages.adminCannotDeleteSelf - Error message for admin self-deletion attempt.
 * @property {string} errorMessages.approvalRequired - Error message for missing approval status.
 * @property {string} errorMessages.unauthorizedFieldUpdate - Error message for unauthorized field modification.
 * @property {string} errorMessages.workUrlRequired - Error message for missing work URL.
 * @property {string} errorMessages.profileUrlRequired - Error message for missing profile URL.
 * @property {string} errorMessages.invalidSHProfile - Error message for invalid SH profile URL format.
 * @property {string} errorMessages.invalidSHProfileUrl - Error message for invalid ScribbleHub profile URL format.
 * @property {string} errorMessages.invalidSHWorkUrl - Error message for invalid ScribbleHub work URL format.
 * @property {string} errorMessages.workExists - Error message for duplicate work report.
 * @property {string} errorMessages.profileExists - Error message for duplicate profile report.
 * @property {string} errorMessages.workNotFound - Error message for non-existent work.
 * @property {string} errorMessages.profileNotFound - Error message for non-existent profile.
 * @property {string} errorMessages.invalidStatus - Error message for invalid status value.
 * @property {string} errorMessages.webhookExists - Error message for duplicate webhook.
 * @property {string} errorMessages.invalidWebhookURL - Error message for invalid Discord webhook URL.
 * @property {string} errorMessages.webhookNotFound - Error message for non-existent webhook.
 * @property {string} errorMessages.corsError - Error message for CORS violations.
 *
 * @property {Object} regexPatterns - Regular expression patterns for validation.
 * @property {RegExp} regexPatterns.shProfileURLPattern - Pattern for validating ScribbleHub profile URLs.
 * @property {RegExp} regexPatterns.shWorkURLPattern - Pattern for validating ScribbleHub work URLs.
 * @property {RegExp} regexPatterns.discordWebhookPattern - Pattern for validating Discord webhook URLs.
 */

require('dotenv').config();

module.exports = {
  env: {
    port: process.env.PORT || 3000,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3001'
    ],
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION || '1h'
  },

  errorMessages: {
    // Authentication & Authorization
    noToken: 'No token provided. Please log in.',
    invalidToken: 'Invalid or expired token. Please log in again.',
    invalidTokenFormat: 'Malformed authorization header. Please log in again.',
    tokenRevoked: 'Token has been revoked. Please log in again.',
    accountNotApproved: 'Account pending approval.',
    wrongPassword: 'Wrong password. Please try again.',
    userNotFound: 'User not found. Please check your username.',

    // User Management
    missingFields: 'Username, SH profile URL and password are required.',
    userExists: 'Username or SH profile URL already in use.',
    onlyAdminsCanAccess: 'You are not authorized to access this resource.',
    onlyAdminsCanUpdateUsers: 'You are not authorized to update this user.',
    onlyAdminsCanDelete: 'You are not authorized to delete this entry.',
    cannotDeleteOtherAdmins: 'You cannot delete other admins.',
    adminCannotDeleteSelf: 'Admins cannot delete themselves.',
    approvalRequired: 'Approval status must be provided.',
    unauthorizedFieldUpdate: 'You are not authorized to modify this field.',

    // Content Management (Works/Profiles)
    workUrlRequired: 'Work URL is required.',
    profileUrlRequired: 'Profile URL is required.',
    invalidSHProfile: 'Invalid SH profile URL format.',
    invalidSHProfileUrl: 'Invalid ScribbleHub profile URL format.',
    invalidSHWorkUrl: 'Invalid ScribbleHub URL format.',
    workExists: 'This work has already been reported.',
    profileExists: 'This profile has already been reported.',
    workNotFound: 'Work not found. Please check the ID and try again.',
    profileNotFound: 'Profile not found. Please check the ID and try again.',
    invalidStatus:
      'Invalid status. Must be one of: pending_review, in_progress, confirmed, taken_down, original',

    // Webhooks
    webhookExists: 'Webhook with this URL already exists',
    invalidWebhookURL: 'Invalid Discord webhook URL format',
    webhookNotFound: 'Webhook not found',

    // System & Validation
    corsError: 'Not allowed by CORS.'
  },

  regexPatterns: {
    shProfileURLPattern:
      /^https:\/\/www\.scribblehub\.com\/profile\/\d+\/[a-zA-Z0-9-_]+\/?$/,
    shWorkURLPattern: /^https:\/\/www\.scribblehub\.com\/series\/\d+/,
    discordWebhookPattern:
      /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/i
  },

  STATUS_COLORS: {
    pending_review: 0xffcc00, // Yellow
    in_progress: 0x3498db, // Blue
    confirmed_violator: 0xe74c3c, // Red
    false_positive: 0x9b59b6, // Purple/Pink
    confirmed: 0x2ecc71, // Green
    taken_down: 0xe74c3c, // Red
    original: 0x9b59b6 // Purple/Pink
  }
};
