const express = require('express');
const { getDatabase, setDatabase } = require('../utils/db');
const verifyToken = require('../middleware/verifyToken');
const logger = require('../utils/logger');
const { errorMessages, regexPatterns } = require('../config');

const router = express.Router();


// Get all webhooks
router.get('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanAccess });
  }

  const webhooks = getDatabase('webhooks');
  res.json(webhooks);
});

// Add new webhook
router.post('/', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanAccess });
  }

  const { url, name } = req.body;
  const webhooks = getDatabase('webhooks');

  if (!regexPatterns.discordWebhookPattern.test(url)) {
    return res.status(400).json({ error: errorMessages.invalidWebhookURL });
  }

  const exists = Object.values(webhooks).some(wh => wh.url === url);
  if (exists) {
    return res.status(409).json({ error: errorMessages.webhookExists });
  }

  const newId = Object.keys(webhooks).length + 1;
  webhooks[newId] = {
    id: newId,
    url,
    name: name || `Webhook ${newId}`,
    created: new Date().toISOString(),
    createdBy: req.user.username,
    lastUsed: null
  };

  setDatabase('webhooks', webhooks);
  logger.info('New webhook added', { webhookId: newId });
  res.status(201).json(webhooks[newId]);
});

// Delete webhook
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: errorMessages.onlyAdminsCanAccess });
  }

  const webhooks = getDatabase('webhooks');
  const { id } = req.params;

  if (!webhooks[id]) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  delete webhooks[id];
  setDatabase('webhooks', webhooks);
  logger.info('Webhook deleted', { webhookId: id });
  res.json({ success: true });
});

module.exports = router;
