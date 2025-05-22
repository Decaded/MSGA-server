const logger = require('../utils/logger');
const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const { sendToAllWebhooks } = require('../utils/webhookNotifier');
const verifyToken = require('../middleware/verifyToken');
const { errorMessages, regexPatterns } = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  const profiles = getDatabase('profiles');
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
    return res.status(400).json({ error: errorMessages.profileUrlRequired });
  }

  if (!regexPatterns.shProfileURLPattern.test(submittedUrl)) {
    return res.status(400).json({ error: errorMessages.invalidSHProfileUrl });
  }

  const isDuplicate = Object.values(profiles).some(
    profile => profile.url.trim() === submittedUrl
  );
  if (isDuplicate) {
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

  sendToAllWebhooks('profile_created', {
    ...newProfile,
    updatedBy: req.user ? req.user.username : 'Anonymous'
  });

  logger.info('New profile report created', {
    profileId: nextIdNum,
    reporter: newProfile.reporter
  });

  res.status(201).json(newProfile);
});

// TODO: Implement PUT and DELETE methods for profiles 

module.exports = router;
