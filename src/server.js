/**
 * Main entry point for the MSGA server application.
 *
 * - Loads environment variables from `.env` file.
 * - Initializes Express app and database connection.
 * - Configures CORS and JSON parsing middleware.
 * - Registers authentication, user, and work-related routes.
 * - Starts the server on the configured port.
 *
 * @module server
 */

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');

const cors = require('cors');
const corsOptions = require('./middleware/corsConfig');

const { initDB } = require('./utils/db');
const logger = require('./utils/logger');

const { env } = require('./config');

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

// 5 requests per minute on login/register to thwart brute‑force
const authLimiter = rateLimit({
	windowMs: 60_000, // 1 minute
	max: 5, // limit each IP to 5 requests per windowMs
	message: {
		error: 'Too many attempts, please try again later.',
	},
});

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
	const { authorization, 'content-type': contentType } = req.headers;
	const safeHeaders = { authorization, 'content-type': contentType };

	// Clone and redact sensitive body fields
	const safeBody = { ...req.body };
	if (safeBody.password) safeBody.password = '***REDACTED***';
	if (safeBody.token) safeBody.token = '***REDACTED***';

	logger.info(`${req.method} ${req.originalUrl}`, {
		ip: req.ip,
		headers: safeHeaders,
		body: safeBody,
	});
	next();
});

// Error logging middleware
app.use((err, req, res, next) => {
	logger.error('Unhandled error', {
		error: err.message,
		stack: err.stack,
		url: req.originalUrl,
		method: req.method,
	});
	next(err);
});

// Rate limiting for authentication routes
app.use('/MSGA/login', authLimiter);
app.use('/MSGA/register', authLimiter);

// Routes
app.use('/MSGA', authRoutes);
app.use('/MSGA/users', userRoutes);
app.use('/MSGA/works', workRoutes);

app.use((err, req, res, next) => {
	logger.error('Unhandled exception', { error: err.message, stack: err.stack });
	res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(env.port, () => {
	logger.info(`Server running at http://localhost:${env.port}`);
});

// Handle server errors
server.on('error', err => {
	logger.error('Server error', { error: err.message });
});
