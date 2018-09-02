'use strict';
//process.on('unhandledRejection', console.dir);

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const cookie = require('cookie');
const Rooter = require('./Models/Rooter.js');
const ChatDB = require('./Models/ChatDB.js');
const chatController = require('./Controllers/ChatController.js');

http.createServer(main).listen(8080);

function main(req, res) {
    const query = url.parse(req.url, true);
    
    console.info((new Date()) + ' requested from "' + req.socket.address().address + '" : ' + query.pathname);

    const apicode = query.pathname;
    chatController.fire(apicode, {
        request: req,
        response: res
    });
}

module.exports = {
    main: main
};