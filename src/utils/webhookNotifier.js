
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

function createDiscordMessage(eventType, work) {

  return {
    username: 'MSGA Notifier',
    avatar_url: 'https://decaded.dev/public/assets/MSGA/logo.png',
    embeds: [
      {
        title: `${eventType.replace('_', ' ').toUpperCase()}`,
        color: 0x58b058,
        fields: [
          { name: 'Title', value: work.title },
          { name: 'Status', value: work.status.toUpperCase(), inline: true },
          { name: 'Reporter', value: work.reporter, inline: true },
          {name:'Updated by', value: work.updatedBy, inline: true},
          { name: 'URL', value: `[View on ScribbleHub](${work.url})` }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'msga.decaded.dev'
        }
      }
    ]
  };
}

module.exports = { sendToAllWebhooks };
