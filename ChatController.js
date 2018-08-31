'use strict';

const cookie = require('cookie');
const url = require('url');
const path = require('path');
const Rooter = require('./Rooter.js');
const ChatDB = require('./ChatDB.js');

const ChatController = new Rooter();
const db = ChatController.DB = new ChatDB({
    host: 'localhost',
    port: 3306,
    user: 'node',
    password: 'node',
    database: 'chat',
});
db.connect()
.then(err => {
    console.info('ChatDB connect success');
})
.catch(err => {
    console.error(err);
});


ChatController.defaultRooting(function (option) {
    const res = option.response;
    res.writeHead(404, {'Content-Type' : 'text/plain'});
    res.end('404 not found.');
});

ChatController.on('/', option => {
    const res = option.response;
    const filepath = path.join(__dirname, 'index.html');
    res.writeHead(200, {'Content-Type': 'text/html'});
    readFile(filepath).then(data => {
        res.end(data);
    })
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('500 Internal Server Error.');
        console.error(err);
    });
});

ChatController.on('/user/create', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'POST') {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('400 Bad Request. Please use POST method.');
        return false;
    }
    return true;
}, option => {
    const session = cookie.parse(req.headers.cookie);
    const username = session.username;
    const password = session.password;

    return db.createUser(username, password)
    .then(option => {
        const res = option.response;
        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end();
    })
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });
});

ChatController.on('/user/login', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'GET') {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('400 Bad Request. Please use GET method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const session = cookie.parse(req.headers.cookie);
    const username = session.username;
    const password = session.password;

    return db.login(username, password)
    .then(() => option)
    .catch(err => { option.error = err; throw option; })
    .then(option => {
        const res = option.response;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end();
    })
    .catch(option => {
        const err = option.error;
        const res = option.response;
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });
});

ChatController.on('/article', function (option) {
    const req = option.request;
    const res = option.response;    
    if (req.method !== 'POST' && req.method !== 'PUT') {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('400 Bad Request. Please use POST or PUT method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const res = option.response;

    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
        // 1e6 = 10^6 = 1MB
        if (body >= 1e6) req.connection.destroy();
    })
    .on('error', err => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err.message);
    })
    .on('end', () => {
        const post = JSON.parse(body);

        const session = cookie.parse(req.headers.cookie);
        const username = session.username;
        const password = session.password;

        db.login(username, password)
        .then(() => {
            return db.post({
                sender: post.sender,
                message: post.message
            });
        })
        .then(id => {
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end();
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('500 Server Internal Error.');
            console.error(err);
        });
    });
});

ChatController.on('/articles', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'GET') {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('400 Bad Request. Please use GET method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const parsedurl = url.parse(req.url, true);
    return db.getArticles(parsedurl.query)
    .then(results => { option.results = results; return option; })
    .catch(err => { option.error = err; throw option; })
    .then(option => {
        const results = option.results;
        const res = option.response;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
    })
    .catch(option => {
        const res = option.response;
        const err = option.error;
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });
});

ChatController.on('/image', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'POST') {
        res.writeHead(400, { 'Content-Type:': 'text/plain' });
        res.end('400 Bad Request. Please use POST method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const res = option.response;

    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
        if (body.length >= 10e6) req.connection.destroy();
    });
    req.on('error', (err) => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });
    req.on('end', () => {
        const post = JSON.parse(body);
        const user = post.sender;
        const message = post.message;
        const imageData = post.imageData;

        db.postImage({
            sender: user,
            message: message,
            data: imageData
        })
        .then(id=> {
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end();
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('500 Server Internal Error.');
            console.error(err);
        });
    });
});

function readFile(filepath) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');
        fs.readFile(filepath, (err, data) => {
            if (!err)
                resolve(data);
            else
                reject(err);
        });
    });
}

module.exports = ChatController;