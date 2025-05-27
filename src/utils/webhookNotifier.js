/**
 * Sends a Discord-formatted message to all registered webhooks for a given event type and data.
 * Updates the `lastUsed` timestamp for each webhook upon successful notification.
 * Logs errors if a webhook notification fails.
 *
 * @async
 * @function
 * @param {string} eventType - The event type, e.g., "profile_added", "work_confirmed". Determines embed layout.
 * @param {Object} data - The data payload to include in the webhook message.
 * @param {string} data.title - The title of the resource/event.
 * @param {string} data.status - The status of the resource (e.g. "pending", "approved").
 * @param {string} data.reporter - The person who reported the resource.
 * @param {string} [data.updatedBy] - The person who last updated the resource (optional).
 * @param {string} data.url - A link to the resource.
 * @returns {Promise<void>} A promise that resolves when all webhook notifications have been processed.
 */

/**
 * Creates a Discord webhook message object based on the event type and provided data.
 * Omits the "Updated by" field if the value is "Anonymous" or not provided.
 *
 * @function
 * @param {string} eventType - The type of event to format the message for.
 * @param {Object} data - The data to include in the message embed.
 * @returns {Object} The formatted Discord webhook message payload.
 */

const STATUS_COLORS = {
  pending_review: 0xffcc00,
  in_progress: 0x3498db,
  confirmed_violator: 0xe74c3c,
  false_positive: 0x2ecc71,
  confirmed: 0x2ecc71,
  taken_down: 0xe74c3c,
  original: 0x95a5a6
};

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { getDatabase, setDatabase } = require('./db');
const logger = require('./logger');

async function sendToAllWebhooks(eventType, data) {
  const webhooks = getDatabase('webhooks');
  const updatedTimestamps = {};
  const now = new Date().toISOString();

  await Promise.all(
    Object.values(webhooks).map(async webhook => {
      try {
        const message = createDiscordMessage(eventType, data, now);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        updatedTimestamps[webhook.id] = now;
      } catch (error) {
        logger.error('Webhook failed', {
          webhookId: webhook.id,
          error: error.message,
          url: webhook.url
        });
      }
    })
  );

  // Save timestamps after all attempts
  for (const [id, timestamp] of Object.entries(updatedTimestamps)) {
    if (webhooks[id]) {
      webhooks[id].lastUsed = timestamp;
    }
  }

  setDatabase('webhooks', webhooks);
}

function createDiscordMessage(eventType, data, timestamp) {
  const isProfile = eventType.startsWith('profile_');
  const fields = [];

  if (isProfile) {
    fields.push(
      { name: 'Profile', value: data.title },
      { name: 'Status', value: data.status.toUpperCase(), inline: true },
      { name: 'Reporter', value: data.reporter, inline: true },
      { name: 'URL', value: `[View Profile](${data.url})` }
    );
  } else {
    fields.push(
      { name: 'Title', value: data.title },
      { name: 'Status', value: data.status.toUpperCase(), inline: true },
      { name: 'Reporter', value: data.reporter, inline: true }
    );

    if (data.updatedBy && data.updatedBy !== 'Anonymous') {
      fields.push({ name: 'Updated by', value: data.updatedBy, inline: true });
    }

    fields.push({ name: 'URL', value: `[View on ScribbleHub](${data.url})` });
  }

  return {
    username: 'MSGA Notifier',
    avatar_url: 'https://decaded.dev/public/assets/MSGA/logo.png',
    embeds: [
      {
        title: eventType.replace(/_/g, ' ').toUpperCase(),
        color: STATUS_COLORS[data.status] ?? 0x95a5a6,
        fields,
        timestamp,
        footer: { text: 'msga.decaded.dev' }
      }
    ]
  };
}

module.exports = { sendToAllWebhooks };
