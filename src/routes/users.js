/**
 * Express router for user-related routes.
 *
 * @module routes/users
 */
const logger = require('../utils/logger');
const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const verifyToken = require('../middleware/verifyToken');
const { errorMessages } = require('../config');

const router = express.Router();

/**
 * GET /
 * Retrieves a list of all users.
 * Requires authentication via verifyToken middleware.
 *
 * @name GET /
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Object[]} 200 - Array of user objects with id, username, shProfileURL, role, and approved status.
 * @throws {401} Unauthorized - If token verification fails.
 */
router.get('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanAccess });
  }

  const users = getDatabase('users');
  logger.info('Fetching all users', { requestingUser: req.user });
  const result = Object.entries(users).map(([id, user]) => ({
    id: parseInt(id),
    username: user.username,
    shProfileURL: user.shProfileURL,
    role: user.role,
    approved: user.approved,
  }));
  res.json(result);
});

/**
 * PUT /:id
 * Updates the approval status of a user by ID.
 * Requires authentication via verifyToken middleware.
 *
 * @name PUT /:id
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Object} 200 - The updated user object.
 * @throws {404} Not Found - If the user does not exist.
 * @throws {400} Bad Request - If the approval status is not provided.
 * @throws {401} Unauthorized - If token verification fails.
 */
router.put('/:id', verifyToken, (req, res) => {
  logger.info('Updating user approval status', {
    userId: req.params.id,
    approved: req.body.approved,
    updatedBy: req.user.id,
  });

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanUpdateUsers });
  }

  const { id } = req.params;
  const { approved } = req.body;
  const users = getDatabase('users');
  if (!users[id]) return res.status(404).json({ error: errorMessages.userNotFound });
  if (approved === undefined) return res.status(400).json({ error: errorMessages.approvalRequired });
  users[id].approved = approved;
  setDatabase('users', users);
  res.json({ id, ...users[id] });
});

/**
 * DELETE /:id
 * Deletes a user by ID.
 * Requires authentication via verifyToken middleware and admin privileges.
 *
 * @name DELETE /:id
 * @function
 * @memberof module:routes/users
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Object} 200 - Success message with deleted user ID and username.
 * @throws {404} Not Found - If the user does not exist.
 * @throws {403} Forbidden - If the requester is not an admin.
 * @throws {400} Bad Request - If an admin attempts to delete themselves.
 * @throws {401} Unauthorized - If token verification fails.
 */
router.delete('/:id', verifyToken, (req, res) => {
  logger.info('Attempting to delete user', {
    targetUserId: req.params.id,
    requestingUser: req.user.id,
  });

  const userId = Number(req.params.id);
  const users = getDatabase('users');

  const userEntry = Object.entries(users).find(([key]) => Number(key) === userId);
  if (!userEntry) return res.status(404).json({ error: errorMessages.userNotFound });

  const [id, user] = userEntry;

  if (req.user.id === userId) {
    return res.status(400).json({ error: errorMessages.adminCannotDeleteSelf });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ error: errorMessages.cannotDeleteOtherAdmins });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanDelete });
  }

  delete users[id];
  setDatabase('users', users);

  logger.info('User deleted successfully', {
    deletedUserId: userId,
    deletedUsername: user.username,
    deletedBy: req.user.id,
  });
  res.json({ success: true, deletedId: userId, username: user.username });
});

module.exports = router;
