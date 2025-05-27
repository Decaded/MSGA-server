/**
 * @module routes/profiles
 * @description Express router for handling profile-related operations.
 * 
 * Routes:
 * - GET /           : Fetch all profiles. Auto-approves profiles not pending review.
 * - POST /          : Submit a new profile report. Validates and prevents duplicates.
 * - PUT /:id/status : Update the status of a profile. Requires authentication.
 * - PUT /:id/approve: Approve a profile and set status to 'in_progress'. Requires authentication.
 * - DELETE /:id     : Delete a profile. Only accessible by admin users.
 * - PUT /:id        : Update profile fields. Only admin can update protected fields ('approved', 'status').
 * 
 * Middleware:
 * - verifyToken     : Ensures the user is authenticated for protected routes.
 * 
 * Utilities:
 * - logger          : For logging actions and warnings.
 * - getDatabase     : Retrieves the profiles database.
 * - setDatabase     : Updates the profiles database.
 * - sendToAllWebhooks: Notifies external services of profile changes.
 * 
 * @requires express
 * @requires ../utils/logger
 * @requires ../utils/db
 * @requires ../utils/webhookNotifier
 * @requires ../middleware/verifyToken
 * @requires ../config
 */

const logger = require('../utils/logger');
const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const { sendToAllWebhooks } = require('../utils/webhookNotifier');
const verifyToken = require('../middleware/verifyToken');
const { errorMessages, regexPatterns } = require('../config');
const e = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  logger.info('Fetching all profiles');
  const profiles = getDatabase('profiles');
  
  // Auto-approve any profile that slipped through and is not pending_review
  Object.values(profiles).forEach(p => {
    if (p.approved === false && p.status !== 'pending_review') {
      logger.debug(`Auto-approving profile ${p.id}`, { profileId: p.id });
      p.approved = true;
    }
  });

  // Update the database with the auto-approved profiles
  setDatabase('profiles', profiles);
  logger.info('Returning all profiles', { count: Object.keys(profiles).length });
  res.json(profiles);
});

router.post('/', (req, res) => {
  logger.info('New profile report submitted', {
    url: req.body.url,
    reporter: req.user ? req.user.username : 'Anonymous'
  });

  const profiles = getDatabase('profiles');
  const existingIds = Object.keys(profiles).map(id => Number(id));
  const nextIdNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  const submittedUrl = req.body.url?.trim();
  if (!submittedUrl) {
    logger.warn('Profile submission failed - missing URL');
    return res.status(400).json({ error: errorMessages.profileUrlRequired });
  }

  if (!regexPatterns.shProfileURLPattern.test(submittedUrl)) {
    logger.warn('Profile submission failed - invalid URL', { url: submittedUrl });
    return res.status(400).json({ error: errorMessages.invalidSHProfileUrl });
  }

  const isDuplicate = Object.values(profiles).some(
    profile => profile.url.trim() === submittedUrl
  );
  if (isDuplicate) {
    logger.warn('Profile submission failed - duplicate profile', { url: submittedUrl });
    return res.status(409).json({ error: errorMessages.profileExists });
  }

  const newProfile = {
    id: nextIdNum,
    title: req.body.title || `Reported Profile ${nextIdNum}`,
    url: submittedUrl,
    status: 'pending_review',
    reporter: req.body.reporter || (req.user ? req.user.username : 'Anonymous'),
    reason: req.body.reason || '',
    proofs: req.body.proofs?.filter(p => p) || [],
    additionalInfo: req.body.additionalInfo || '',
    dateReported: new Date().toISOString().split('T')[0],
    approved: false
  };

  profiles[nextIdNum] = newProfile;
  setDatabase('profiles', profiles);

  logger.info('Sending profile_created webhook', { profileId: nextIdNum });
  sendToAllWebhooks('profile_created', {
    ...newProfile,
    updatedBy: req.user ? req.user.username : 'Anonymous'
  });

  logger.info('New profile report created successfully', {
    profileId: nextIdNum,
    title: newProfile.title,
    reporter: newProfile.reporter
  });

  res.status(201).json(newProfile);
});

router.put('/:id/status', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const profiles = getDatabase('profiles');
  const profile = profiles[id];

  const validStatuses = [
    'pending_review',
    'in_progress',
    'confirmed_violator',
    'false_positive'
  ];
  if (!validStatuses.includes(status)) {
    logger.warn('Invalid status provided', { status });
    return res.status(400).json({ error: errorMessages.invalidStatus });
  }

  if (!profiles[id] || !profile) {
    logger.warn('Status update failed - profile not found', { profileId: id });
    return res.status(404).json({ error: errorMessages.profileNotFound });
  }

  const oldStatus = profile.status;
  profiles[id].status = status;

  // Auto-approve if status is changed but not approved
  if (profiles[id].approved === false) {
    logger.debug(`Auto-approving profile during status update`, { profileId: id });
    profiles[id].approved = true;
  }

  setDatabase('profiles', profiles);

  logger.info('Sending profile_updated webhook', { profileId: id });
  sendToAllWebhooks('profile_updated', {
    ...profiles[id],
    updatedBy: req.user.username
  });

  logger.info('Profile status updated', {
    profileId: id,
    oldStatus,
    newStatus: status,
    updatedBy: req.user.username
  });

  res.json(profiles[id]);
});

router.put('/:id/approve', verifyToken, (req, res) => {
  const { id } = req.params;
  const profiles = getDatabase('profiles');

  if (!profiles[id]) {
    logger.warn('Approval failed - profile not found', { profileId: id });
    return res.status(404).json({ error: errorMessages.profileNotFound });
  }

  profiles[id].approved = true;
  profiles[id].status = 'in_progress';
  setDatabase('profiles', profiles);

  logger.info('Sending profile_updated webhook', { profileId: id });
  sendToAllWebhooks('profile_updated', {
    ...profiles[id],
    updatedBy: req.user.username
  });

  logger.info('Profile approved', {
    profileId: id,
    title: profiles[id].title,
    approvedBy: req.user.username
  });

  res.json(profiles[id]);
});

router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized delete attempt', { user: req.user.username });
    return res.status(403).json({ error: errorMessages.onlyAdminsCanDelete });
  }
  
  const id = parseInt(req.params.id);
  const profiles = getDatabase('profiles');
  const profileEntry = Object.entries(profiles).find(([_, profile]) => profile.id === id);

  if (!profileEntry) {
    logger.warn('Delete failed - profile not found', { profileId: id });
    return res.status(404).json({ error: errorMessages });
  }

  const [dbKey, profile] = profileEntry;
  delete profiles[dbKey];
  setDatabase('profiles', profiles);

  logger.info('Sending profile_deleted webhook', { profileId: id });
  sendToAllWebhooks('profile_deleted', {
    ...profile,
    updatedBy: req.user.username
  });

  logger.info('Profile deleted', {
    profileId: id,
    title: profile.title,
    deletedBy: req.user.username
  });

  res.json({ success: true, deletedId: id });
});

router.put('/:id', verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  const profiles = getDatabase('profiles');
  const profileEntry = Object.entries(profiles).find(([_, profile]) => profile.id === id);

  if (!profileEntry) {
    logger.warn('Update failed - profile not found', { profileId: id });
    return res.status(404).json({ error: errorMessages.profileNotFound });
  }

  if (req.user.role !== 'admin') {
    const protectedFields = ['approved', 'status'];
    const isEditingProtectedField = Object.keys(req.body).some(key =>
      protectedFields.includes(key)
    );
    if (isEditingProtectedField) {
      logger.warn('Unauthorized field update attempt', { 
        user: req.user.username,
        fields: Object.keys(req.body).filter(key => protectedFields.includes(key))
      });
      return res.status(403).json({ error: errorMessages.unauthorizedFieldUpdate });
    }
  }

  const [dbKey, profile] = profileEntry;
  const changes = {};

  // Log changes by comparing old and new values
  Object.keys(req.body).forEach(key => {
    if (profile[key] !== req.body[key]) {
      changes[key] = {
        oldValue: profile[key],
        newValue: req.body[key]
      };
    }
  });

  logger.info('Sending profile_updated webhook', { profileId: id });
  sendToAllWebhooks('profile_updated', {
    ...profile,
    updatedBy: req.user.username
  });

  Object.assign(profile, req.body);
  profiles[dbKey] = profile;
  setDatabase('profiles', profiles);

  if (Object.keys(changes).length > 0) {
    logger.info('Profile updated', {
      profileId: id,
      changes,
      updatedBy: req.user.username
    });
  } else {
    logger.info('Profile update request with no changes', { profileId: id });
  }

  res.json(profile);
});

module.exports = router;
