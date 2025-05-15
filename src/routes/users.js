/**
 * Express router for user-related routes.
 *
 * @module routes/users
 */

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
router.get('/', verifyToken, (_, res) => {
	const users = getDatabase('users');
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
	const { id } = req.params;
	const { approved } = req.body;
	const users = getDatabase('users');
	if (!users[id]) return res.status(404).json({ error: errorMessages.userNotFound });
	if (approved === undefined) return res.status(400).json({ error: errorMessages.approvalRequired });
	users[id].approved = approved;
	setDatabase('users', users);
	res.json({ id, ...users[id] });
});

module.exports = router;
