const express = require('express');
const bodyParser = require('body-parser');
const process = require('process');
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;  // switch out to xhr2 https://stackoverflow.com/questions/32604460/xmlhttprequest-module-not-defined-found/46081151#46081151
global.WebSocket = require('ws');  // https://flaviocopes.com/node-websockets/
require('./flureedbnjs.js');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var flureeDbConn;
var njsConnections = [];
var flureeIsAvailable = false;
var isShuttingDown = false;
var server; // defined by listener function

//------------------------
// Handlers for shut-down
//------------------------
function shutDownHandler() {
    isShuttingDown = true;
    console.log('Received kill signal, shutting down gracefully');
    server.close(() => {
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
            flureedbnjs.close(flureeDbConn);
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
const flureedbUrl = "http://localhost:8090";
flureedbnjs.connect_p(flureedbUrl)
    .then(conn => {
        flureeDbConn = conn;
        flureeIsAvailable = true;
    })
    .catch(error => {
        console.error("Error connecting to Fluree DB", error);
        //  [  1.771s] [app] "Server contact error: " 
        //  "xhttp error - http://localhost:8090/fdb/health" 
        //  {:url "http://localhost:8090/fdb/health", :error :xhttp/http-error}
        // -> gracefully shutdown NodeJS server
    })


//------------------------
// Listener
//------------------------
var server = app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}`));


//-------------------------
// Handlers for connections
//-------------------------
server.on('connection', connection => {
    njsConnections.push(connection);
    connection.on('close', () => njsConnections = njsConnections.filter(curr => curr !== connection));
});


//------------------------
// Routes
//------------------------
app.post('/api/db/:network/:db/:action', (request, response) => {
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
            flureedbnjs.block_query(flureeDbConn, ledger, query, opts)
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
            flureedbnjs.block_range(flureeDbConn, ledger, start, end, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
            
        case 'collection_id':
            db = flureedbnjs.db(flureeDbConn, ledger);
            flureedbnjs.collection_id(db, body.name)
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
            flureedbnjs.delete_ledger(flureeDbConn, ledger, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'db_schema':
            db = flureedbnjs.db(flureeDbConn, ledger);
            flureedbnjs.db_schema(db)
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
             flureedbnjs.graphql(flureeDbConn, ledger, query, opts)
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
            db = flureedbnjs.db(flureeDbConn, ledger, opts);
            flureedbnjs.history_query(db, query, opts)
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
            db = flureedbnjs.db(flureeDbConn, ledger, opts);
            flureedbnjs.multi_query(db, query, opts)
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
            flureedbnjs.monitor_tx(flureeDbConn, ledger, txid, timeout)
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
            flureedbnjs.new_ledger(flureeDbConn, ledger, opts)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;

        case 'predicate_id':
            db = flureedbnjs.db(flureeDbConn, ledger);
            flureedbnjs.predicate_id(db, body.name)
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
            db = flureedbnjs.db(flureeDbConn, ledger, opts);
            flureedbnjs.q(db, query, opts)
            .then (results => {
                response.send(JSON.stringify(results));
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;
        
        case 'resolve_ledger':
            results = flureedbnjs.resolve_ledger(flureeDbConn, ledger);
            response.send(results);
            break;
                            
        case 'signed_query':
            if (body.query) query = JSON.stringify(body.query);
            if (body.opts)  opts = JSON.stringify(body.opts);
            flureedbnjs.signed_query(flureeDbConn, ledger, query, opts)
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
            db = flureedbnjs.db(flureeDbConn, ledger, opts);
            flureedbnjs.sparql(db, query)
            .then (results => {
                response.send(results);
            })
            .catch(error => {
                console.log(error);
                response.status(500).send(error);
            });
            break;    

        case 'subject_id':
            db = flureedbnjs.db(flureeDbConn, ledger);
            console.info("invoking sparql with ", body.subject);
            flureedbnjs.subject_id(db, JSON.stringify(body.subject))
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
            flureedbnjs.transact(flureeDbConn, ledger, txn, opts)
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

//------------------------
// test data - jic
//------------------------
let accounts = [
    { id: 1, name: "Fluree" },
    { id: 2, name: "SSBI" },
    { id: 3, name: "Deloitte" }
];

//------------------------
// Routes - jic
//------------------------
app.get('/accounts', (request, response) => {
    response.json(accounts);
});
app.get('/accounts/:id', (request, response) => {
    const accountId = Number(request.params.id);
    const getAccount = accounts.find((account) => account.id === accountId);
    if (!getAccount) {
        response.status(404).send('Account not found.');
    }
    else {
        response.json(getAccount);
    }
});
app.post('/accounts', (request, response) => {
    const incomingAccount = request.body;
    accounts.push(incomingAccount);
    response.json(accounts);
});
app.put(`/accounts/:id`, (request, response) => {
    const accountId = Number(request.params.id);
    const body = request.body;
    const account = accounts.find((account) => account.id === accountId);
    const index = accounts.indexOf(account);
  
    if (!account) {
      response.status(500).send('Account not found.');
    } else {
      const updatedAccount = { ...account, ...body };
  
      accounts[index] = updatedAccount;
  
      response.send(updatedAccount);
    }
});
app.delete(`/accounts/:id`, (request, response) => {
    const accountId = Number(request.params.id);
    const newAccounts = accounts.filter((account) => account.id != accountId);
  
    if (!newAccounts) {
      response.status(500).send('Account not found.');
    } else {
      accounts = newAccounts;
      response.send(accounts);
    }
});
app.get(`/`, (request, response) => {
    response.send('Hello, World');
});




//// Code to open a connection specifically for one request 
// app.post('/api/db/:network/:db/:action', (request, response) => {
//     var   flureeDbConn;
//     const network = request.params.network;
//     const dbId    = request.params.db;
//     const action  = request.params.action.toLowerCase();
//     const params  = request.params;
//     const body    = request.body;
//     const ledger  = network + '/' + dbId;
//     switch (action) {
//         case 'query':
//             flureedbnjs.connect_p(flureedbUrl)
//             .then(conn =>
//                 {
//                     flureeDbConn = conn;
//                     db = flureedbnjs.db(conn, ledger);
//                     flureedbnjs.q(db, JSON.stringify(body))
//                     .then (results => {
//                         response.send(results);
//                     })
//                     .catch(error => 
//                         {
//                             console.log(error);
//                             response.status(500).send(error);
//                     })
//                     .finally(() => { if (flureeDbConn !== undefined) flureedbnjs.close(flureeDbConn); });
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