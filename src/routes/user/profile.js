/**
 * Express router for user profile-related operations.
 *
 * @module routes/user/profile
 *
 * @requires express
 * @requires bcryptjs
 * @requires ../../middleware/verifyToken
 * @requires ../../utils/db
 * @requires ../../config
 * @requires ../../utils/logger
 */

/**
 * Middleware to verify JWT token for all profile routes.
 * @name use(verifyToken)
 * @function
 */

/**
 * GET /
 * Retrieves the authenticated user's profile information.
 *
 * @name GET /
 * @function
 * @memberof module:routes/user/profile
 * @param {Object} req - Express request object. Requires authenticated user in req.user.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - User profile info (username, shProfileURL, role, approved, dateCreated)
 * @returns {Object} 404 - Error if user not found
 */

/**
 * PATCH /password
 * Allows the authenticated user to change their password.
 *
 * @name PATCH /password
 * @function
 * @memberof module:routes/user/profile
 * @param {Object} req - Express request object. Requires oldPassword and newPassword in body.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Error if missing fields
 * @returns {Object} 403 - Error if old password incorrect
 * @returns {Object} 404 - Error if user not found
 */

/**
 * POST /delete-request
 * Submits an account deletion request for the authenticated user.
 *
 * @name POST /delete-request
 * @function
 * @memberof module:routes/user/profile
 * @param {Object} req - Express request object. Requires reason in body.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - Success message
 * @returns {Object} 400 - Error if missing fields
 * @returns {Object} 404 - Error if user not found
 * @returns {Object} 409 - Error if pending deletion request already exists
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const verifyToken = require('../../middleware/verifyToken');
const { getDatabase, setDatabase } = require('../../utils/db');
const { errorMessages, confirmationMessages } = require('../../config');
const logger = require('../../utils/logger');

const router = express.Router();
router.use(verifyToken);

router.get('/', (req, res) => {
  const users = getDatabase('users');
  const user = users[req.user.id];

  if (!user) return res.status(404).json({ error: errorMessages.userNotFound });

  const { username, shProfileURL, role, approved } = user;
  res.json({
    username,
    shProfileURL,
    role,
    approved,
    dateCreated: user.dateCreated || 'Unknown'
  });
});

router.patch('/password', (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: errorMessages.missingFields });
  }

  const users = getDatabase('users');
  const user = users[req.user.id];
  if (!user) return res.status(404).json({ error: errorMessages.userNotFound });

  const valid = bcrypt.compareSync(oldPassword, user.password);
  if (!valid)
    return res.status(403).json({ error: errorMessages.wrongPassword });

  user.password = bcrypt.hashSync(newPassword, 10);
  setDatabase('users', users);

  logger.info('User updated password', { userId: req.user.id });
  res.json({ success: true, message: confirmationMessages.passwordUpdated });
});

router.post('/delete-request', (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: errorMessages.missingFields });
  }

  const users = getDatabase('users');
  const user = users[req.user.id];
  if (!user) return res.status(404).json({ error: errorMessages.userNotFound });

  const deletionRequests = getDatabase('deletionRequests');
  // Check for existing pending request
  const existingRequest = Object.values(deletionRequests).find(
    request => request.userId === req.user.id && request.status === 'pending'
  );

  if (existingRequest) {
    return res.status(409).json({ error: errorMessages.deletionRequestExists });
  }

  const newId = Object.keys(deletionRequests).length + 1;

  deletionRequests[newId] = {
    userId: req.user.id,
    username: user.username,
    requestDate: new Date().toISOString(),
    reason,
    status: 'pending'
  };

  setDatabase('deletionRequests', deletionRequests);

  logger.info('User submitted account deletion request', {
    userId: req.user.id,
    requestId: newId
  });

  res.json({
    success: true,
    message: confirmationMessages.deletionRequestSubmitted
  });
});

module.exports = router;
