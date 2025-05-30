const NyaDB = require('@decaded/nyadb');
const db = new NyaDB();

/**
 * Initializes the database by ensuring required collections exist.
 * Required collections: 'users', 'works'.
 */
const initDB = () => {
  const required = ['users', 'works', 'profiles', 'blockedTokens', 'webhooks', 'uploads'];
  required.forEach(name => {
    if (!db.getList().includes(name)) db.create(name);
  });
};

/**
 * Retrieves the data for the specified collection from the database.
 * @param {string} name - The name of the collection to retrieve.
 * @returns {*} The data stored in the specified collection.
 */
const getDatabase = name => db.get(name);

/**
 * Sets the data for the specified collection in the database.
 * @param {string} name - The name of the collection to update.
 * @param {*} data - The data to store in the collection.
 */
const setDatabase = (name, data) => db.set(name, data);

module.exports = { initDB, getDatabase, setDatabase };
