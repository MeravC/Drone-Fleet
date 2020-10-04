

const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '307958876',
  port: 5432,
});

module.exports = function slaves(jsonObj) {//receives requests from the master.
  let results = [];
  for (const key of jsonObj.Drones) {
    results.push(update(key));//update the Drone if exists.
    results.push(insert(key));//insert a new drone.
  }
  return results;
}

function update(jsonObj) {
    
  const { id, date, ip, payload, status } = jsonObj;
  pool.query(`UPDATE "Drone Fleet" SET "Last Update" = $1,"Drone IP" = $2,"Payload" = $3,"Status" = $4
  WHERE "Drone ID" = $5`, [new Date(), ip, payload, status, id], (error, results) => {
    if (error) {
        throw error;
    }
  });
  return jsonObj;
}

function insert(jsonObj) {
  const { id, date, ip, payload, status } = jsonObj;

  pool.query(`INSERT INTO "Drone Fleet" ("Drone ID","Last Update","Drone IP","Payload","Status")
      SELECT $1, $2, $3, $4, $5
      WHERE NOT EXISTS (SELECT 1 FROM "Drone Fleet" WHERE "Drone ID"=$1)`, [id, new Date(), ip, payload, status],
       (error, results) => {
    if (error) {
      throw error;
    }
  });
  return jsonObj;
}



