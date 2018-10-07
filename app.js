'use strict';
//process.on('unhandledRejection', console.error);

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const cookie = require('cookie');
const Rooter = require('./Models/Rooter.js');
const ChatDB = require('./Models/ChatDB.js');
const chatController = require('./Controllers/ChatController.js');
global.Logger = new (require('./Models/Logger.js'))('server_log.txt');

http.createServer(main).listen(process.env.PORT || 8080);

function main(req, res) {
    const query = url.parse(req.url, true);
    
    Logger.info('requested from "' + req.socket.address().address + '" : ' + query.pathname);

    const apicode = query.pathname;
    chatController.fire(apicode, {
        request: req,
        response: res
    });
}

module.exports = {
    main: main
};