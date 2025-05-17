/**
 * CORS configuration middleware.
 *
 * @module corsConfig
 * @property {function} origin - Function to validate the request origin against allowed origins.
 * @property {boolean} credentials - Indicates whether the request can include user credentials.
 *
 * The `origin` function checks if the request's origin is included in the list of allowed origins
 * defined in the environment configuration. If the origin is allowed or not present, the request is accepted.
 * Otherwise, an error with a custom CORS error message is returned.
 */
const { env, errorMessages } = require('../config');

module.exports = {
  origin: (origin, callback) => {
    if (!origin || env.allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(errorMessages.corsError));
  },
  credentials: false
};
