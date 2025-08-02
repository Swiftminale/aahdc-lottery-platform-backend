// backend/config/config.js
require('dotenv').config(); // Ensure dotenv is loaded here

module.exports = {
  development: {
    use_env_variable:
      "postgresql://ysowiltmwclkinstkeef:kucxxxviqdvxkiybmkyczdjkjtmnsl@9qasp5v56q8ckkf5dc.leapcellpool.com:6438/goztuovzifaupnqcgvcb?sslmode=require", // Use the DATABASE_URL from .env
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true, // Enforce SSL connection
        rejectUnauthorized: false, // Set to true in production with valid certs, false for self-signed or development ease
      },
    },
    logging: false, // Set to true to see SQL queries in console
  },
  production: {
    use_env_variable:
      "postgresql://ysowiltmwclkinstkeef:kucxxxviqdvxkiybmkyczdjkjtmnsl@9qasp5v56q8ckkf5dc.leapcellpool.com:6438/goztuovzifaupnqcgvcb?sslmode=require",
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true, // Always true in production
      },
    },
    logging: false,
  },
};
