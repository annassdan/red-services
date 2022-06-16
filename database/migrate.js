const {pool} = require("./database");

const createRedTableAccess = `
CREATE TABLE IF NOT EXISTS red_access (
  id varchar(255) NOT NULL,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP,
  created_by  varchar(255),
  updated_by  varchar(255),
  email varchar(250) NOT NULL,
  role varchar DEFAULT 'ALL',
  active boolean default true,
  user_id varchar,
  PRIMARY KEY (id),
  CONSTRAINT fk_red_access
      FOREIGN KEY(user_id)
  REFERENCES brpl_administrator_sysuser(uuid)
);
`;


const queries = [
    `insert into red_access (id, created_at, created_by, updated_at, updated_by, email, role, active, user_id) 
     values ('1', now(), 'superuser', now(), 'superuser', 'info@intelion.co.id', 'ALL', true, null)`,
    `insert into red_access (id, created_at, created_by, updated_at, updated_by, email, role, active, user_id) 
     values ('2', now(), 'superuser', now(), 'superuser', 'annas@intelion.co.id', 'ALL', true, null)`,
    `insert into red_access (id, created_at, created_by, updated_at, updated_by, email, role, active, user_id) 
     values ('3', now(), 'superuser', now(), 'superuser', 'ananta@intelion.co.id', 'ALL', true, null)`,
    `insert into red_access (id, created_at, created_by, updated_at, updated_by, email, role, active, user_id) 
     values ('4', now(), 'superuser', now(), 'superuser', 'adhitya@intelion.co.id', 'ALL', true, null)`,
    `insert into red_access (id, created_at, created_by, updated_at, updated_by, email, role, active, user_id) 
     values ('5', now(), 'superuser', now(), 'superuser', 'patricia@intelion.co.id', 'ALL', true, null)`
];

/**
 * Run queries of data
 * @param list
 * @param index
 * @param done
 */
function runListData(list = [], index = -1, done = (() => {})) {
    pool.query(list[index], (error, data) => {
        index = index + 1;
        if (index < list.length) {
            runListData(list, index, done);
        } else {
            console.log('Migrate query done.');
            done();
        }
    });
}

function runMigrate(done) {
    console.log('Running migrate query...')
    pool.query(createRedTableAccess, (error, data) => {
        runListData(queries, 0, done);
    });
}

module.exports = runMigrate;

