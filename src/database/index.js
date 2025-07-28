// backend/src/database/index.js
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize using the DATABASE_URL environment variable
const sequelize = new Sequelize(dbConfig.use_env_variable, {
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  logging: dbConfig.logging,
  pool: { // Adjust pool settings for serverless environments if needed
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.Unit = require('../../models/unit')(sequelize, DataTypes);
// Add other models here as your application grows (e.g., User, Project)

module.exports = db;
