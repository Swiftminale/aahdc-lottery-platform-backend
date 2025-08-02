// backend/src/database/index.js
import { Sequelize, DataTypes } from "sequelize";
import * as config from "../../config/config.js";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Initialize Sequelize using the DATABASE_URL environment variable
const sequelize = new Sequelize(dbConfig.use_env_variable, {
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  logging: dbConfig.logging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ESM-compatible dynamic import of models
import unitModel from "../../models/unit.js";
db.Unit = unitModel(sequelize, DataTypes);

// Export the db object
export default db;
