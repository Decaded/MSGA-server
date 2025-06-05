/**
 * Authentication routes for user login, registration, and logout.
 *
 * @module routes/auth
 */

/**
 * POST /login
 * Authenticates a user and returns a JWT token if successful.
 *
 * @route POST /login
 * @param {string} req.body.username - The username of the user.
 * @param {string} req.body.password - The user's password.
 * @returns {Object} 200 - An object containing the JWT token and user info.
 * @returns {Object} 404 - If the user is not found.
 * @returns {Object} 401 - If the password is incorrect.
 * @returns {Object} 403 - If the account is not approved.
 */

/**
 * POST /register
 * Registers a new user.
 *
 * @route POST /register
 * @param {string} req.body.username - The username for the new user.
 * @param {string} req.body.shProfileURL - The SH profile URL for the user.
 * @param {string} req.body.password - The password for the new user.
 * @returns {Object} 201 - The newly created user object.
 * @returns {Object} 400 - If required fields are missing or SH profile URL is invalid.
 * @returns {Object} 409 - If the username or SH profile URL already exists.
 */

/**
 * POST /logout
 * Logs out the authenticated user by blocking their JWT token.
 *
 * @route POST /logout
 * @middleware verifyToken - Middleware to verify JWT token.
 * @returns {Object} 200 - Success response.
 */

const logger = require('../utils/logger');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, setDatabase } = require('../utils/db');
const verifyToken = require('../middleware/verifyToken');
const { env, errorMessages, regexPatterns } = require('../config');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  logger.info('Login attempt', { username });
  const users = getDatabase('users');
  const userEntry = Object.entries(users).find(
    ([_, u]) => u.username === username
  );

  if (!userEntry) {
    logger.warn('Login failed - user not found', { username });
    return res.status(404).json({ error: errorMessages.userNotFound });
  }
  const [userId, user] = userEntry;

  if (!bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: errorMessages.wrongPassword });
  if (!user.approved)
    return res.status(403).json({ error: errorMessages.accountNotApproved });

  const token = jwt.sign(
    {
      id: Number(userId),
      username: user.username,
      role: user.role,
      jti: uuidv4()
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiration }
  );

  logger.info('Login successful', { userId, username: user.username });

  res.json({
    token,
    user: {
      id: Number(userId),
      username: user.username,
      role: user.role,
      approved: user.approved,
      shProfileURL: user.shProfileURL
    }
  });
});

router.post('/register', (req, res) => {
  const { username, shProfileURL, password } = req.body;
  logger.info('Registration attempt', { username, shProfileURL });
  if (!username || !shProfileURL || !password)
    return res.status(400).json({ error: errorMessages.missingFields });
  const pattern = regexPatterns.shProfileURLPattern;
  if (!pattern.test(shProfileURL))
    return res.status(400).json({ error: errorMessages.invalidSHProfile });

  const users = getDatabase('users');
  if (
    Object.values(users).find(
      u => u.username === username || u.shProfileURL === shProfileURL
    )
  ) {
    logger.warn('Registration failed - user exists', {
      username,
      shProfileURL
    });
    return res.status(409).json({ error: errorMessages.userExists });
  }

  const existingIds = Object.keys(users).map(Number);
  const newId = (
    existingIds.length ? Math.max(...existingIds) + 1 : 0
  ).toString();

  const hashedPassword = bcrypt.hashSync(password, 10);
  users[newId] = {
    username,
    shProfileURL,
    password: hashedPassword,
    role: 'user',
    approved: false
  };
  setDatabase('users', users);

  logger.info('User registered successfully', { newId, username });
  res.status(201).json({ id: newId, ...users[newId] });
});

router.post('/logout', verifyToken, (req, res) => {
  const { jti } = req.user;
  const blockedTokens = getDatabase('blockedTokens');

  blockedTokens[jti] = {
    blockedAt: new Date().toISOString(),
    expiresAt: req.user.exp * 1000
  };

  setDatabase('blockedTokens', blockedTokens);
  logger.info('User logging out', {
    userId: req.user.id,
    username: req.user.username
  });
  res.json({ success: true });
});

module.exports = router;
