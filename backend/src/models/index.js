// backend/src/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// --- Correction Point 1: Load config directly ---
const dbConfigObject = require(__dirname + '/../config/database.js');
const config = dbConfigObject[env]; // Get specific config for current environment

const db = {};

let sequelize;
// --- Correction Point 2: Simplified sequelize instantiation ---
if (config && config.storage) { // Check if config and storage path exist
  sequelize = new Sequelize({ // Pass options object directly for SQLite
    dialect: config.dialect || 'sqlite',
    storage: config.storage,
    logging: config.logging === console.log ? console.log : (config.logging ? msg => config.logging(msg) : false), // Handle logging function or boolean
  });
} else {
  // This should ideally not happen if .env and config/database.js are correct
  console.error(`🔴 Critical Error: Database configuration for environment '${env}' is missing or invalid.`);
  console.error("Please check your .env file and backend/src/config/database.js");
  if (config) console.error("Loaded config object:", config); else console.error("dbConfigObject was:", dbConfigObject);
  process.exit(1); // Exit if DB config is broken
}


fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.syncDb = async () => {
  try {
    const syncOptions = env === 'development' ? { alter: true } : { alter: false }; // alter:false for prod is safer
    await sequelize.sync(syncOptions);
    console.log('Database synchronized successfully.');

    if (env === 'development' && db.ProductVariant) {
      const count = await db.ProductVariant.count();
      if (count === 0) {
        console.log('Seeding initial ProductVariants...');
        await db.ProductVariant.bulkCreate([
          { productType: 'T-Shirt', size: 'M', color: 'black', thickness: 180, thicknessName: 'Forma flow', basePrice: 349.00 },
          { productType: 'T-Shirt', size: 'L', color: 'black', thickness: 180, thicknessName: 'Forma flow', basePrice: 349.00 },
          { productType: 'T-Shirt', size: 'M', color: 'black', thickness: 240, thicknessName: 'Forma dense', basePrice: 499.00 },
        ]);
        console.log('ProductVariants seeded.');
      }
    }
  } catch (error) {
    console.error('Error syncing database:', error);
    // Propagate the error if it's critical during startup
    // For a more robust app, you might implement retry logic or specific error handling here
    throw error;
  }
};

module.exports = db;