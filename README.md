# Fluree NodeJS Example

This mini-application uses the [Fluree NodeJS library](https://docs.flur.ee/library/nodejs/overview) to stand-up a Fluree query peer along-side a *downloaded* Fluree instance.  

## Get Started

### 1. Start Fluree

Download and unzip the latest version of [Fluree Community Edition](https://fluree-releases-public.s3.amazonaws.com/fluree-latest.zip#).

Navigate to the folder where unzipped Fluree, and run `./fluree_start.sh`. If you have Java 8+ installed, this should launch Fluree.  The Admin UI for the instance is available at `http://localhost:8080`. 

&nbsp;

### 2. Start Fluree NodeJS Query Peer

If not already installed, [download NodeJS](https://nodejs.org/en/download/) for your environment.  

Execute the following commands to download and run the project:

```all
git clone https://github.com/fluree/fluree-nodejs-server.git
```

```all
cd fluree-nodejs-server
npm install
npm start
```

The Fluree NodeJS Query Peer should immediately start-up and connect to the local Fluree instance.  The Fluree NodeJS Server application is accessible at http://localhost:3000/. 

```all
Fluree NodeJs Library v0.13.0 BETA
Express server currently running on port 3000
```

&nbsp;

### 3. Try out a few commands

The following endpoints are wired-up in this Fluree NodeJS Server application.  You can validate the commands using [Postman](https://www.postman.com/) or curl.  

Action | Command | Explanation 
-- | -- | --
New Ledger | `new_ledger` | Submits a request to creates a new ledger to the *downloaded* Fluree instance.
Delete Ledger | `delete_ledger` | Deletes a ledger. The request is submitted to the *downloaded* Fluree instance.
Query | `query` | Query in FlureeQL syntax.
Block | `block_query` | Block queries in FlureeQL syntax.
History |  `history_query`| History queries in FlureeQL syntax.
Multi-Query | `multi_query` | Multi-Queries in FlureeQL syntax.
GraphQL | `graphql` | Queries or transactions in GraphQL syntax, as a string.
SPARQL | `sparql` | Queries in SPARQL syntax, as a string.
Transact | `transact` | Submits a transaction for a ledger to the *downloaded* Fluree instance.
---

&nbsp;

#### `new_ledger`
Creates a new ledger from the specified "network/id".  The request is submitted to the *downloaded* Fluree instance.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/new_ledger
Header: 'Content-Type: application/json'
Body: None

curl --location --request POST 'http://localhost:3000/api/db/test/chat/new_ledger' \
--header 'Content-Type: application/json'
```
---
#### `delete_ledger`
Deletes a ledger identified by the "network/id".  The request is submitted to the *downloaded* Fluree instance.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/delete_ledger
Header: 'Content-Type: application/json'
Body: None

curl --location --request POST 'http://localhost:3000/api/db/test/chat/delete_ledger' \
--header 'Content-Type: application/json'
```
---
#### `query`
Executes a query against the specified ledger.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/query
Header: 'Content-Type: application/json'
Body: {"query": {"select":["*"],"from":"_collection"}}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/query' \
--header 'Content-Type: application/json' \
--data-raw '{"query": {"select":["*"],"from":"_collection"}}'
```
---
#### `block_query`
Executes a block query in FlureeQL syntax against the specified ledger.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/block_query
Header: 'Content-Type: application/json'
Body: {"query": { "block": [2,2], "pretty-print": true}}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/block_query' \
--header 'Content-Type: application/json' \
--data-raw '{"query": { "block": [2,2], "pretty-print": true}}
'
```
---
#### `history_query`
Executes a history query in FlureeQL syntax against the specified ledger.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/history_query
Header: 'Content-Type: application/json'
Body: {"query": { "history": ["_collection/name", "_predicate"]}}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/history' \
--header 'Content-Type: application/json' \
--data-raw '{"query": { "history": ["_collection/name", "_predicate"]}}
'
```
---
#### `multi_query`
Executes a history query in FlureeQL syntax against the specified ledger.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/multi_query
Header: 'Content-Type: application/json'
Body: {"query": { "collections": { "select": ["*"], "from": "_collection"},
            "users": { "select": ["*"], "from": "_user"}}}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/multi_query' \
--header 'Content-Type: application/json' \
--data-raw '{"query": { "collections": { "select": ["*"], "from": "_collection"},
            "users": { "select": ["*"], "from": "_user"}}}'
```
---
#### `graphql`
Executes queries or transactions in GraphQL syntax, as a string.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/graphql
Header: 'Content-Type: application/json'
Body: {"graphql": { "query": "{graph {_collection {_id name }}}",
  "variables": null,
  "operationName": null
}}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/graphql' \
--header 'Content-Type: application/json' \
--data-raw '{"graphql": { "query": "{graph {_collection {_id name }}}",
  "variables": null,
  "operationName": null
}}'
```
---
#### `sparql`
Executes queries in SPARQL syntax, as a string.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/sparql
Header: 'Content-Type: application/json'
Body: {"query": "SELECT ?collection WHERE {  ?collectionID fdb:_collection/name ?collection. }"}

curl --location --request POST 'http://localhost:3000/api/db/test/chat/sparql' \
--header 'Content-Type: application/json' \
--data-raw '{"query": "SELECT ?collection WHERE {  ?collectionID fdb:_collection/name ?collection. }"}
'
```
---
#### `transact`
Submits a transaction for a ledger to the *downloaded* Fluree instance.

```all
Action: POST
Endpoint: http://localhost:3000/api/db/test/chat/sparql
Header: 'Content-Type: application/json'
Body: { "txn": [ {  "_id": "_collection",  "name": "eateries" }, {  "_id": "_predicate",  "name": "eateries/zip",  "doc": "jurisdiction or mail code",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/notes",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/avgrating",  "doc": "Average rating from reporting clientele",  "type": "int" }, {  "_id": "_predicate",  "name": "eateries/age",  "doc": "Age of the establishment, not the owners",  "type": "int" }, {  "_id": "_predicate",  "name": "eateries/country",  "doc": "Country, if Earth; planet otherwise",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/state",  "doc": "State or government jurisdiction area",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/city",  "doc": "City in which establishment exists",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/address-line-2",  "doc": "Ancillary information, such as suite or PO Box",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/address-line-1",  "doc": "Street address of establishment",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/name",  "doc": "Name of the establishment",  "type": "string",  "unique": true,  "index": true }], "opts": { "timeout": 10000 }}

curl --location --request POST 'http://localhost:3000/api/db/test/directory/transact' \
--header 'Content-Type: application/json' \
--data-raw '{ "txn": [ {  "_id": "_collection",  "name": "eateries" }, {  "_id": "_predicate",  "name": "eateries/zip",  "doc": "jurisdiction or mail code",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/notes",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/avgrating",  "doc": "Average rating from reporting clientele",  "type": "int" }, {  "_id": "_predicate",  "name": "eateries/age",  "doc": "Age of the establishment, not the owners",  "type": "int" }, {  "_id": "_predicate",  "name": "eateries/country",  "doc": "Country, if Earth; planet otherwise",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/state",  "doc": "State or government jurisdiction area",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/city",  "doc": "City in which establishment exists",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/address-line-2",  "doc": "Ancillary information, such as suite or PO Box",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/address-line-1",  "doc": "Street address of establishment",  "type": "string" }, {  "_id": "_predicate",  "name": "eateries/name",  "doc": "Name of the establishment",  "type": "string",  "unique": true,  "index": true }], "opts": { "timeout": 10000 }}'
```



&nbsp;
## License
This project is licensed under the terms of the MIT license.
