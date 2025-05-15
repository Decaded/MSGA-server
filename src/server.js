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

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');

const app = express();
initDB();

app.use(cors(corsOptions));
app.use(express.json());
app.use(
	session({
		secret: env.sessionSecret,
		resave: false,
		saveUninitialized: true,
	}),
);

app.use('/MSGA', authRoutes);
app.use('/MSGA/users', userRoutes);
app.use('/MSGA/works', workRoutes);

app.listen(env.port, () => console.log(`Server running at http://localhost:${env.port}`));
