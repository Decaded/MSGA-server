/**
 * Express router for handling "works" related routes.
 *
 * Endpoints:
 * - GET /           : Returns all works from the database.
 * - POST /          : Adds a new work report. Validates URL and required fields.
 * - PUT /:id/status : Updates the status of a work entry by ID. Requires authentication.
 * - PUT /:id/approve: Approves a work entry and sets its status to 'in_progress'. Requires authentication.
 * - DELETE /:id     : Deletes a work entry by ID. Requires authentication.
 * - PUT /:id        : Updates a work entry by ID with provided fields. Requires authentication.
 *
 * Middleware:
 * - verifyToken: Used for protected routes to ensure the user is authenticated.
 *
 * Utilities:
 * - getDatabase: Retrieves the current state of the 'works' database.
 * - setDatabase: Persists changes to the 'works' database.
 *
 * Error Handling:
 * - Returns appropriate error messages and status codes for missing fields, invalid URLs, or not found entries.
 *
 * @module routes/works
 */
const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const verifyToken = require('../middleware/verifyToken');
const { errorMessages, regexPatterns } = require('../config');

const router = express.Router();

router.get('/', (_, res) => {
	console.log('Fetching all works');
	res.json(getDatabase('works'));
});

router.post('/', (req, res) => {
	const works = getDatabase('works');
	const existingIds = Object.keys(works).map(Number);
	const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

	const submittedUrl = req.body.url?.trim();
	if (!submittedUrl) return res.status(400).json({ error: errorMessages.missingURL });

	const pattern = regexPatterns.shWorkURLPattern;
	if (!pattern.test(submittedUrl)) return res.status(400).json({ error: errorMessages.invalidSHWorkUrl });

	const isDuplicate = Object.values(works).some(work => work.url.trim() === submittedUrl);
	if (isDuplicate) return res.status(409).json({ error: errorMessages.workExists });

	const newWork = {
		id: nextId,
		title: req.body.title || `Reported Work ${nextId}`,
		url: submittedUrl,
		status: 'pending_review',
		reporter: req.user ? req.user.username : 'Anonymous',
		reason: req.body.reason || '',
		proofs: req.body.proofs?.filter(p => p) || [],
		additionalInfo: req.body.additionalInfo || '',
		dateReported: new Date().toISOString().split('T')[0],
		approved: false,
	};

	works[nextId] = newWork;
	setDatabase('works', works);
	res.status(201).json(newWork);
});

router.put('/:id/status', verifyToken, (req, res) => {
	const { id } = req.params;
	const { status } = req.body;
	const works = getDatabase('works');
	if (!works[id]) return res.status(404).json({ error: errorMessages.workNotFound });
	works[id].status = status;
	setDatabase('works', works);
	res.json(works[id]);
});

router.put('/:id/approve', verifyToken, (req, res) => {
	const { id } = req.params;
	const works = getDatabase('works');
	if (!works[id]) return res.status(404).json({ error: errorMessages.workNotFound });
	works[id].approved = true;
	works[id].status = 'in_progress';
	setDatabase('works', works);
	res.json(works[id]);
});

router.delete('/:id', verifyToken, (req, res) => {
	const id = parseInt(req.params.id);
	const works = getDatabase('works');
	const workEntry = Object.entries(works).find(([_, work]) => work.id === id);
	if (!workEntry) return res.status(404).json({ error: errorMessages.workNotFound });
	const [dbKey] = workEntry;
	delete works[dbKey];
	setDatabase('works', works);
	res.json({ success: true, deletedId: id });
});

router.put('/:id', verifyToken, (req, res) => {
	const id = parseInt(req.params.id);
	const works = getDatabase('works');
	const workEntry = Object.entries(works).find(([_, work]) => work.id === id);
	if (!workEntry) return res.status(404).json({ error: errorMessages.workNotFound });
	const [dbKey, work] = workEntry;
	Object.assign(work, req.body);
	works[dbKey] = work;
	setDatabase('works', works);
	res.json(work);
});

module.exports = router;
