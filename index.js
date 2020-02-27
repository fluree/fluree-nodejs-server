const express = require('express');
const bodyParser = require('body-parser');
const process = require('process');
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // switch out to xhr2 https://stackoverflow.com/questions/32604460/xmlhttprequest-module-not-defined-found/46081151#46081151
global.WebSocket = require('ws');  // https://flaviocopes.com/node-websockets/
require('./flureenjs.js');

const server = express();
const PORT = 3000;

server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

var flureeDbConn;
var njsConnections = [];
var flureeIsAvailable = false;
var isShuttingDown = false;
var listener; // defined by listener function

//------------------------
// Handlers for shut-down
//------------------------
function shutDownHandler() {
    isShuttingDown = true;
    console.log('Received kill signal, shutting down gracefully');
    listener.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);

    njsConnections.forEach(curr => curr.end());
    setTimeout(() => njsConnections.forEach(curr => curr.destroy()), 5000);

    if (flureeDbConn !== undefined)
    {
        try {
            flureenjs.close(flureeDbConn);
            flureeIsAvailable = false;
        }
        catch (error) {
            console.warn("error closing connection: ", error);
        }
    }
}
process.on('SIGTERM', shutDownHandler);
process.on('SIGINT', shutDownHandler);


//------------------------
// Start-up query instance
//------------------------
const flureeUrl = "http://localhost:8090";
flureenjs.connect_p(flureeUrl)
    .then(conn => {
        flureeDbConn = conn;
        flureeIsAvailable = true;
    })
    .catch(error => {
        console.error("Error connecting to Fluree DB", error);
        //  [  1.771s] [server] "Server contact error: " 
        //  "xhttp error - http://localhost:8090/fdb/health" 
        //  {:url "http://localhost:8090/fdb/health", :error :xhttp/http-error}
        // -> gracefully shutdown NodeJS server
    })


//------------------------
// Listener
//------------------------
listener = server.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));


//-------------------------
// Handlers for connections
//-------------------------
listener.on('connection', connection => {
    njsConnections.push(connection);
    connection.on('close', () => njsConnections = njsConnections.filter(curr => curr !== connection));
});


//------------------------
// Routes
//------------------------
server.post('/api/db/:network/:db/:action', (request, response) => {
    const network = request.params.network;
    const dbId    = request.params.db;
    const action  = request.params.action.toLowerCase();
    const params  = request.params;
    const body    = request.body || {};
    const ledger  = network + '/' + dbId;

    // "shared" variable names
    var db = null;
    var opts = null;
    var query = null;
    var txn = null;

    switch (action) {
            
        case 'block_query':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.block_query(flureeDbConn, ledger, query, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'block_range':
            const start = (body.start ? Number(body.start) : null);
            const end = (body.end ? Number(body.end) : null);
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.block_range(flureeDbConn, ledger, start, end, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
            
        case 'collection_id':
            db = flureenjs.db(flureeDbConn, ledger);
            flureenjs.collection_id(db, body.name)
            .then (results => {
                // Get a number back
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'delete_ledger':
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.delete_ledger(flureeDbConn, ledger, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'db_schema':
            db = flureenjs.db(flureeDbConn, ledger);
            flureenjs.db_schema(db)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
                            
        case 'graphql':
            if (body.graphql) query = JSON.stringify(body.graphql);
            if (body.opts)  opts = JSON.stringify(body.opts);
             flureenjs.graphql(flureeDbConn, ledger, query, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;    

        case 'history':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.history_query(db, query, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;    
            
        case 'multi_query':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.multi_query(db, query, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;    
        
        case 'monitor_tx':
            // retrieve txid and timeout from body
            const txid = body.txid;
            const timeout = (body.timeout ? Number(body.timeout) : 0);
            flureenjs.monitor_tx(flureeDbConn, ledger, txid, timeout)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'new_ledger':
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.new_ledger(flureeDbConn, ledger, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'predicate_id':
            db = flureenjs.db(flureeDbConn, ledger);
            flureenjs.predicate_id(db, body.name)
            .then (results => {
                // Expecting bumber
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
        
        case 'query':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.q(db, query, opts)
            .then (results => {
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
        
        case 'resolve_ledger':
            results = flureenjs.resolve_ledger(flureeDbConn, ledger);
            console.log(results);
            response.send(results);
            break;
                            
        case 'signed_query':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.signed_query(flureeDbConn, ledger, query, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'sparql':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            db = flureenjs.db(flureeDbConn, ledger, opts);
            flureenjs.sparql(db, query)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;    

        case 'subject_id':
            db = flureenjs.db(flureeDbConn, ledger);
            console.info("invoking sparql with ", body.subject);
            flureenjs.subject_id(db, JSON.stringify(body.subject))
            .then (results => {
                // Expecting a number
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
                    
        case 'transact':
            txn = JSON.stringify(body.txn);
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureenjs.transact(flureeDbConn, ledger, txn, opts)
            .then (results => {
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        default:
            response.status(404).send('Invalid action requested');
            break;
    }
});


//// Code to open a connection specifically for one request 
// server.post('/api/db/:network/:db/:action', (request, response) => {
//     var   flureeDbConn;
//     const network = request.params.network;
//     const dbId    = request.params.db;
//     const action  = request.params.action.toLowerCase();
//     const params  = request.params;
//     const body    = request.body;
//     const ledger  = network + '/' + dbId;
//     switch (action) {
//         case 'query':
//             flureenjs.connect_p(flureedbUrl)
//             .then(conn =>
//                 {
//                     flureeDbConn = conn;
//                     db = flureenjs.db(conn, ledger);
//                     flureenjs.q(db, JSON.stringify(body))
//                     .then (results => {
//                         response.send(results);
//                     })
//                     .catch(error => 
//                         {
//                             console.log(error);
//                             response.status(500).send(error);
//                     })
//                     .finally(() => { if (flureeDbConn !== undefined) flureenjs.close(flureeDbConn); });
//                 })
//             .catch(error => 
//                 {
//                     console.log(error);
//                     response.status(500).send(error);
//                 })
//             break;

//         default:
//             response.status(404).send('Invalid action requested');
//             break;
//     }
// });