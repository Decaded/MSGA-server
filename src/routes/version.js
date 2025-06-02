const express = require('express');
const logger = require('../utils/logger');
const { errorMessages, client_version, changes } = require('../config');

const router = express.Router();

// GET app version
router.get('/', (req, res) => {

  if (!client_version) {
    logger.error('Version data not found in database');
    return res.status(500).json({ error: errorMessages.versionNotFound });
  }

  logger.info('Version data retrieved successfully', { client_version, changes });
  res.json({ client_version, changes });
});

module.exports = router;
