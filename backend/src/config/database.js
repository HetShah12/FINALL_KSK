// backend/src/config/database.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.DATABASE_STORAGE_PATH || './kiosk_dev.sqlite', // Default path if not in .env
    logging: console.log, // Log SQL queries in development
  },
  production: {
    dialect: 'sqlite',
    storage: process.env.DATABASE_STORAGE_PATH || './kiosk_prod.sqlite', // Separate prod DB
    logging: false,
  },
};