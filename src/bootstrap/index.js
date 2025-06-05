/**
 * Bootstraps the application by initializing the database.
 * Logs a success message if the database is initialized successfully,
 * otherwise logs an error and exits the process.
 *
 * @async
 * @function bootstrap
 * @returns {Promise<void>} Resolves when the database is initialized.
 */

const { initDB } = require('../utils/db');
const logger = require('../utils/logger');

const bootstrap = async () => {
  try {
    await initDB();
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Database initialization failed', { error: err.message });
    process.exit(1);
  }
};

module.exports = bootstrap;
