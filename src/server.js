/**
 * Main entry point for the MSGA server application.
 *
 * - Loads environment variables from `.env` file.
 * - Initializes Express app and database connection.
 * - Configures CORS, JSON parsing, and session management middleware.
 * - Registers authentication, user, and work-related routes.
 * - Starts the server on the configured port.
 *
 * @module index
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { env } = require('./config');
const corsOptions = require('./middleware/corsConfig');
const { initDB } = require('./utils/db');
const logger = require('./utils/logger'); // Add this line

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');

const app = express();

// Log database initialization
try {
  initDB();
  logger.info('Database initialized successfully');
} catch (err) {
  logger.error('Database initialization failed', { error: err.message });
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }),
);

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Add error logging middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  next(err);
});

app.use('/MSGA', authRoutes);
app.use('/MSGA/users', userRoutes);
app.use('/MSGA/works', workRoutes);

const server = app.listen(env.port, () => {
  logger.info(`Server running at http://localhost:${env.port}`);
});

// Handle server errors
server.on('error', (err) => {
  logger.error('Server error', { error: err.message });
});
