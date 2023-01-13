process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
    console.log(err.stack);
});
const path = require('path');
const fs = require('fs');
const express = require("express");
const port = process.env.PORT || 8080;
const http = require("http");
var sessions = {};

function initServer() {
    const app = express();
    app.use('/', express.static(path.join(__dirname, "public"))); 
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.get('/', (req, res) => res.render('index'));
        
    let server = http.createServer(app);
    server.listen(port);
    console.log(`app listening on port ${port}!`);
}

initServer();


