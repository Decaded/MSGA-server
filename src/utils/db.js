/**
 * Initializes the database by ensuring all required collections exist.
 * Required collections: 'users', 'works', 'profiles', 'blockedTokens', 'webhooks'.
 */

/**
 * Retrieves the data for the specified collection from the database.
 * @param {string} name - The name of the collection to retrieve.
 * @returns {*} The data stored in the specified collection.
 */

/**
 * Sets the data for the specified collection in the database.
 * @param {string} name - The name of the collection to set.
 * @param {*} data - The data to store in the collection.
 */

const NyaDB = require('@decaded/nyadb');
const db = new NyaDB();

const initDB = () => {
  const required = [
    'users',
    'works',
    'profiles',
    'blockedTokens',
    'webhooks',
    'deletionRequests'
  ];
  required.forEach(name => {
    if (!db.getList().includes(name)) db.create(name);
  });
};

const getDatabase = name => db.get(name);

const setDatabase = (name, data) => db.set(name, data);

module.exports = { initDB, getDatabase, setDatabase };
