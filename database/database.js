const Pool = require('pg').Pool;
const pool = new Pool({
    user: process.env.RED_DB_USERNAME,
    host: process.env.RED_DB_HOST,
    database: process.env.RED_DB,
    password: process.env.RED_DB_PASSWORD,
    port: process.env.RED_DB_PORT,
});

module.exports = {
  pool
};
