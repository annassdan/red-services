const Pool = require('pg').Pool;
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'e_brpl_2',
    password: 'talasbogor',
    port: 5432,
})
