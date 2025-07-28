// backend/config/config.js
require('dotenv').config(); // Ensure dotenv is loaded here

module.exports = {
  development: {
    use_env_variable: 'postgresql://neondb_owner:npg_fsU07WANQuiz@ep-red-poetry-a2ejalxz-pooler.eu-central-1.aws.neon.tech/aahdc_Prod?sslmode=require&channel_binding=require', // Use the DATABASE_URL from .env
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true, // Enforce SSL connection
        rejectUnauthorized: false // Set to true in production with valid certs, false for self-signed or development ease
      }
    },
    logging: false, // Set to true to see SQL queries in console
  },
  production: {
    use_env_variable: 'postgresql://neondb_owner:npg_fsU07WANQuiz@ep-weathered-star-a2p5as5z-pooler.eu-central-1.aws.neon.tech/aahdc-lottery-db?sslmode=require&channel_binding=require' ,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true // Always true in production
      }
    },
    logging: false,
  }
};
