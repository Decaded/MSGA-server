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
const logger = require('../utils/logger');
const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const verifyToken = require('../middleware/verifyToken');
const { errorMessages, regexPatterns } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  logger.info('Fetching all works');
  const works = getDatabase('works');
  // Auto‑approve any work that slipped through
  Object.values(works).forEach(w => {
    if (w.approved === false) {
      w.approved = true;
    }
  });

  // Update the database with the auto-approved works
  setDatabase('works', works);

  // Convert to array and sort by id descending (newest first)
  const sortedWorks = Object.values(works).sort((a, b) => b.id - a.id);
  res.json(sortedWorks);
});

router.post('/', (req, res) => {
  logger.info('New work report submitted', {
    url: req.body.url,
    reporter: req.user ? req.user.username : 'Anonymous'
  });

  const works = getDatabase('works');
  const existingIds = Object.keys(works).map(id => Number(id));
  const nextIdNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  const nextId = nextIdNum.toString();

  const submittedUrl = req.body.url?.trim();
  if (!submittedUrl) {
    logger.warn('Work submission failed - missing URL');
    return res.status(400).json({ error: errorMessages.workUrlRequired });
  }

  const pattern = regexPatterns.shWorkURLPattern;
  if (!pattern.test(submittedUrl)) {
    logger.warn('Work submission failed - invalid URL', { url: submittedUrl });
    return res.status(400).json({ error: errorMessages.invalidSHWorkUrl });
  }
  const isDuplicate = Object.values(works).some(
    work => work.url.trim() === submittedUrl
  );
  if (isDuplicate) {
    logger.warn('Work submission failed - duplicate work', {
      url: submittedUrl
    });
    return res.status(409).json({ error: errorMessages.workExists });
  }
  const newWork = {
    id: nextIdNum,
    title: req.body.title || `Reported Work ${nextId}`,
    url: submittedUrl,
    status: 'pending_review',
    reporter: req.body.reporter || (req.user ? req.user.username : 'Anonymous'),
    reason: req.body.reason || '',
    proofs: req.body.proofs?.filter(p => p) || [],
    additionalInfo: req.body.additionalInfo || '',
    dateReported: new Date().toISOString().split('T')[0],
    approved: false
  };

  works[nextId] = newWork;
  setDatabase('works', works);

  logger.info('New work created successfully', {
    workId: nextIdNum,
    title: newWork.title,
    reporter: newWork.reporter
  });

  res.status(201).json(newWork);
});

router.put('/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const works = getDatabase('works');
  const work = works[id];

  const validStatuses = [
    'pending_review',
    'in_progress',
    'confirmed',
    'taken_down',
    'original'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: errorMessages.invalidStatus });
  }

  if (!works[id] || !work) {
    logger.warn('Status update failed - work not found', { workId: id });
    return res.status(404).json({ error: errorMessages.workNotFound });
  }

  const oldStatus = work.status;

  works[id].status = status;

  // If someone changed status but forgot to approve, auto‑approve it
  if (works[id].approved === false) {
    works[id].approved = true;
  }

  setDatabase('works', works);

  logger.info('Work status updated', {
    workId: id,
    oldStatus,
    newStatus: status,
    updatedBy: req.user.username
  });

  res.json(works[id]);
});

router.put('/:id/approve', verifyToken, (req, res) => {
  const { id } = req.params;
  const works = getDatabase('works');

  if (!works[id]) {
    logger.warn('Approval failed - work not found', { workId: id });
    return res.status(404).json({ error: errorMessages.workNotFound });
  }

  works[id].approved = true;
  works[id].status = 'in_progress';
  setDatabase('works', works);

  logger.info('Work approved', {
    workId: id,
    title: works[id].title,
    approvedBy: req.user.username
  });

  res.json(works[id]);
});

router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanDelete });
  }
  const id = parseInt(req.params.id);
  const works = getDatabase('works');
  const workEntry = Object.entries(works).find(([_, work]) => work.id === id);

  if (!workEntry) {
    logger.warn('Delete failed - work not found', { workId: id });
    return res.status(404).json({ error: errorMessages.workNotFound });
  }

  const [dbKey, work] = workEntry;
  delete works[dbKey];
  setDatabase('works', works);
  logger.info('Work deleted', {
    workId: id,
    title: work.title,
    deletedBy: req.user.username
  });

  res.json({ success: true, deletedId: id });
});

router.put('/:id', verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  const works = getDatabase('works');
  const workEntry = Object.entries(works).find(([_, work]) => work.id === id);

  if (!workEntry) {
    logger.warn('Update failed - work not found', { workId: id });
    return res.status(404).json({ error: errorMessages.workNotFound });
  }

  if (req.user.role !== 'admin') {
    const protectedFields = ['approved', 'status'];
    const isEditingProtectedField = Object.keys(req.body).some(key =>
      protectedFields.includes(key)
    );
    if (isEditingProtectedField) {
      return res
        .status(403)
        .json({ error: errorMessages.unauthorizedFieldUpdate });
    }
  }

  const [dbKey, work] = workEntry;
  const changes = {};

  // Log changes by comparing old and new values
  Object.keys(req.body).forEach(key => {
    if (work[key] !== req.body[key]) {
      changes[key] = {
        oldValue: work[key],
        newValue: req.body[key]
      };
    }
  });

  Object.assign(work, req.body);
  works[dbKey] = work;
  setDatabase('works', works);

  if (Object.keys(changes).length > 0) {
    logger.info('Work updated', {
      workId: id,
      changes,
      updatedBy: req.user.username
    });
  } else {
    logger.info('Work update request with no changes', { workId: id });
  }

  res.json(work);
});

module.exports = router;
