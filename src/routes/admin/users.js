/**
 * @module routes/users
 * @description Express router for user management endpoints.
 *
 * Endpoints:
 * - GET /users: Fetch all users (admin only).
 * - PUT /users/:id: Update user approval status (admin only).
 * - DELETE /users/:id: Delete a user (admin only, cannot delete self or other admins).
 *
 * Middleware:
 * - verifyToken: Ensures the request is authenticated and attaches user info to req.user.
 *
 * Utilities:
 * - logger: For logging actions and events.
 * - getDatabase, setDatabase: For accessing and updating the in-memory user database.
 * - errorMessages: Standardized error messages for responses.
 *
 * @requires express
 * @requires ../utils/logger
 * @requires ../utils/db
 * @requires ../middleware/verifyToken
 * @requires ../config
 */

const logger = require('../../utils/logger');
const express = require('express');
const { getDatabase, setDatabase } = require('../../utils/db');
const verifyToken = require('../../middleware/verifyToken');
const { errorMessages } = require('../../config');

const router = express.Router();

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
    approved: user.approved
  }));
  res.json(result);
});

router.put('/:id', verifyToken, (req, res) => {
  logger.info('Updating user approval status', {
    userId: req.params.id,
    approved: req.body.approved,
    updatedBy: req.user.id
  });

  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ error: errorMessages.onlyAdminsCanUpdateUsers });
  }

  const { id } = req.params;
  const { approved } = req.body;
  const users = getDatabase('users');
  if (!users[id])
    return res.status(404).json({ error: errorMessages.userNotFound });
  if (approved === undefined)
    return res.status(400).json({ error: errorMessages.approvalRequired });
  users[id].approved = approved;
  setDatabase('users', users);
  res.json({ id, ...users[id] });
});

router.delete('/:id', verifyToken, (req, res) => {
  logger.info('Attempting to delete user', {
    targetUserId: req.params.id,
    requestingUser: req.user.id
  });

  const userId = Number(req.params.id);
  const users = getDatabase('users');

  const userEntry = Object.entries(users).find(
    ([key]) => Number(key) === userId
  );
  if (!userEntry)
    return res.status(404).json({ error: errorMessages.userNotFound });

  const [id, user] = userEntry;

  if (req.user.id === userId) {
    return res.status(400).json({ error: errorMessages.adminCannotDeleteSelf });
  }

  if (user.role === 'admin') {
    return res
      .status(403)
      .json({ error: errorMessages.cannotDeleteOtherAdmins });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanDelete });
  }

  delete users[id];
  setDatabase('users', users);

  logger.info('User deleted successfully', {
    deletedUserId: userId,
    deletedUsername: user.username,
    deletedBy: req.user.id
  });
  res.json({ success: true, deletedId: userId, username: user.username });
});

module.exports = router;
