/**
 * Express router for handling version-related endpoints.
 *
 * @module routes/version
 *
 * @requires express
 * @requires ../utils/logger
 * @requires ../config
 *
 * @description
 * GET / - Returns the current client version, changes, changelog, and button text.
 * If the client version is not found, responds with a 500 error.
 * Logs both error and successful retrieval events.
 */

const express = require('express');
const logger = require('../utils/logger');
const {
  errorMessages,
  client_version,
  changes,
  changelog,
  button_text
} = require('../config');

const router = express.Router();

// GET app version
router.get('/', (req, res) => {
  if (!client_version) {
    logger.error('Version data not found in database');
    return res.status(500).json({ error: errorMessages.versionNotFound });
  }

  logger.info('Version data retrieved successfully', {
    client_version,
    changes
  });
  res.json({
    client_version,
    changes,
    changelog,
    button_text
  });
});

module.exports = router;
