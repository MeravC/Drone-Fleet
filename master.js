const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cluster = require('cluster');

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);


const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: '307958876',
    port: 5432,
});



//get request, returns a list of json object.
app.get('/getDrones', (request, response, next) => {
    
    pool.query('SELECT * FROM "Drone Fleet" ', (error, results) => {
        if (error) {
            next("error");
        } else {
            response.status(200).json(results.rows);
        }
    });
});

//get request, returns drones from the last X minutes.
//if X is negative or non numeric, X will be 10 minutes. 
app.get('/getDronesX', (request, response, next) => {
    let xMinutes = request.query.x;
    if (xMinutes <= -1 || isNaN(xMinutes)) {
        xMinutes = 10;
    }
    pool.query(`SELECT * FROM "Drone Fleet" WHERE "Last Update" >= NOW() - INTERVAL '${xMinutes} minutes'`, (error, results) => {
        if (error) {
            next("error");
        } else {
            response.status(200).json(results.rows);
        }
        
    });
});

//post request, returns "ok" or "error"
//Send the json object to the slave for storing
app.post('/addDrones', (request, response, next) => {
    try {
        if (cluster.isWorker) {
            const slaves = require('./slave.js');
            slaves(JSON.parse(request.body.drone_data));
            next("ok");
        } else {
            cluster.fork();
        }
    } 
    catch(error) {
        next("error");
    }
});


if (cluster.isWorker) {

    app.use(express.static('public'));

    app.get('/', function (request, response, next) {
        if (error) {
            next("error");
        } else {
            response.sendFile(path.join(__dirname + 'index.html'));//load the client page
        }
    });

    app.listen(port, () => {
        console.log(`App running on port ${port}.`);
    });

} else {
    cluster.fork();
}

app.use(function (req,res,next){
	res.status(404).send('Unable to find the requested resource!');
});