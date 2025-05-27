/**
 * Sends a Discord-formatted message to all registered webhooks for a given event type and data.
 * Updates the `lastUsed` timestamp for each webhook upon successful notification.
 * Logs errors if a webhook notification fails.
 *
 * @async
 * @function
 * @param {string} eventType - The type of event triggering the webhook notification.
 * @param {Object} data - The data payload to include in the webhook message.
 * @returns {Promise<void[]>} A promise that resolves when all webhook notifications have been attempted.
 */

/**
 * Creates a Discord webhook message object based on the event type and provided data.
 *
 * @function
 * @param {string} eventType - The type of event to format the message for.
 * @param {Object} data - The data to include in the message embed.
 * @returns {Object} The formatted Discord webhook message payload.
 */

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { getDatabase, setDatabase } = require('./db');
const logger = require('./logger');

async function sendToAllWebhooks(eventType, data) {
  const webhooks = getDatabase('webhooks');

  return Promise.all(
    Object.values(webhooks).map(async webhook => {
      try {
        const message = createDiscordMessage(eventType, data);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Update lastUsed timestamp
        webhooks[webhook.id].lastUsed = new Date().toISOString();
        setDatabase('webhooks', webhooks);
      } catch (error) {
        logger.error('Webhook failed', {
          webhookId: webhook.id,
          error: error.message,
          url: webhook.url
        });
      }
    })
  );
}

function createDiscordMessage(eventType, data) {
  if (eventType.startsWith('profile_')) {
    return {
      username: 'MSGA Notifier',
      avatar_url: 'https://decaded.dev/public/assets/MSGA/logo.png',
      embeds: [
        {
          title: `${eventType.replace('_', ' ').toUpperCase()}`,
          color: 0x58b058,
          fields: [
            { name: 'Profile', value: data.title },
            { name: 'Status', value: data.status.toUpperCase(), inline: true },
            { name: 'Reporter', value: data.reporter, inline: true },
            { name: 'URL', value: `[View Profile](${data.url})` }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'msga.decaded.dev' }
        }
      ]
    };
  }

  return {
    username: 'MSGA Notifier',
    avatar_url: 'https://decaded.dev/public/assets/MSGA/logo.png',
    embeds: [
      {
        title: `${eventType.replace('_', ' ').toUpperCase()}`,
        color: 0x58b058,
        fields: [
          { name: 'Title', value: data.title },
          { name: 'Status', value: data.status.toUpperCase(), inline: true },
          { name: 'Reporter', value: data.reporter, inline: true },
          { name: 'Updated by', value: data.updatedBy, inline: true },
          { name: 'URL', value: `[View on ScribbleHub](${data.url})` }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'msga.decaded.dev' }
      }
    ]
  };
}

module.exports = { sendToAllWebhooks };
