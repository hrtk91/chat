'use strict';
//process.on('unhandledRejection', console.dir);

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const cookie = require('cookie');
const Rooter = require('./Rooter.js');
const ChatDB = require('./ChatDB.js');
const chatController = require('./ChatController.js');

http.createServer(main).listen(8080);

function main(req, res) {
    const query = url.parse(req.url, true);

    const apicode = query.pathname;
    chatController.fire(apicode, {
        request: req,
        response: res
    });
}

function setHeaderFromExtension(ext, res) {
    switch (ext) {
        case '.html':
            res.writeHead(200, {'Content-Type': 'text/html'});
            break;
        case '.js':
            res.writeHead(200, {'Content-Type': 'application/json'});
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            break;
    }
}

function writeResponse(filepath, res) {
    fs.readFile(filepath, (err, data) => {
        if (!err) {
            res.end(data);
        } else {
            res.end('404 NotFound');
        }
    });
}

