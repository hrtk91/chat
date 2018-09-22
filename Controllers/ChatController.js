'use strict';

const cookie = require('cookie');
const url = require('url');
const path = require('path');
const fs = require('fs');
const Rooter = require(path.join(process.cwd(), '/Models/Rooter.js'));
const ChatDB = require(path.join(process.cwd(), '/Models/ChatDB.js'));

const ChatController = new Rooter();
const db = new ChatDB({
    host: 'localhost',
    port: 3306,
    user: 'node',
    password: 'node',
    dbname: 'chat',
});
db.connect()
.then(err => {
    console.info('ChatDB connect success');
})
.catch(err => {
    console.error(err);
});

function readFile(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (!err)
                resolve(data);
            else
                reject(err);
        });
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
        case '.css':
            res.writeHead(200, {'Content-Type': 'text/css'});
            break;
        default:
            res.writeHead(404, {'Content-Type': 'text/plain'});
            break;
    }
}

ChatController.defaultRooting(function (option) {
    const req = option.request;
    const res = option.response;
    const query = url.parse(req.url, true);
    const filepath = path.join(process.cwd(), 'web', query.pathname);
    const ext = path.extname(filepath);

    if (query.pathname.indexOf('../') !== -1 || query.pathname.indexOf('..\\') !== -1) {
        res.writeHead(403, {'Content-Type' : 'text/html'});
        res.end('403 Forbidden.')
        return;
    }

    if (ext && fs.existsSync(filepath) === true) {
        setHeaderFromExtension(ext, res);
        readFile(filepath).then(data => res.end(data));
        console.info((new Date()) + ' responsed To "' + req.socket.address().address + '" : ' + filepath);
        return;
    } else {
        res.writeHead(404, {'Content-Type' : 'text/html'});
        res.end('404 not found.');
        return;
    }
});

ChatController.on('/', option => {
    const res = option.response;
    const filepath = path.join(process.cwd(), 'web', 'index.html');
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
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.end('400 Bad Request. Please use POST method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const res = option.response;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', function () {
        const post = JSON.parse(body || '{}');
        const session = cookie.parse(req.headers.cookie || '');
        const username = post.username || session.username;
        const password = post.password || session.password;
    
        db.createUser(username, password)
        .then(() => {
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end();
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('500 Server Internal Error.');
            console.error(err);
        });
    });
});

ChatController.on('/user/login', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('400 Bad Request. Please use GET method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const res = option.response;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', function () {
        const post = JSON.parse(body || '{}');
        const session = cookie.parse(req.headers.cookie || '');
        const username = post.sender || session.username;
        const password = post.password || session.password;
    
        db.login(username, password)
        .then(() => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end();
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('500 Server Internal Error.');
            console.error(err);
        });
    });
});

ChatController.on('/article', function (option) {
    const req = option.request;
    const res = option.response;    
    if (req.method !== 'POST' && req.method !== 'PUT') {
        res.writeHead(400, {'Content-Type': 'text/html'});
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
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('500 Server Internal Error.');
        console.error(err.message);
    })
    .on('end', () => {
        const post = JSON.parse(body);

        const session = cookie.parse(req.headers.cookie || '');
        const username = post.sender || session.username;
        const password = post.password || session.password;

        db.post({
                sender: username,
                password: password,
                message: post.message,
        })
        .then(id => {
            res.writeHead(201, {'Content-Type': 'application/json'});
            res.end();
        })
        .catch(err => {
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('500 Server Internal Error.');
            console.error(err);
        });
    });
});
ChatController.on('/latestArticle', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'GET') {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.end('400 Bad Request. Please use GET method.');
        return false;
    }
    return true;
}, option => {
    const res = option.response;
    db.getlatestArticle()
    .then(article => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(article));
    })
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('500 Internal Server Error.');
        console.error(err);
    });
});

ChatController.on('/articles', function (option) {
    const req = option.request;
    const res = option.response;
    if (req.method !== 'GET') {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.end('400 Bad Request. Please use GET method.');
        return false;
    }
    return true;
}, option => {
    const req = option.request;
    const res = option.response;
    const parsedurl = url.parse(req.url, true);
    db.getArticles(parsedurl.query)
    .then(results => {
        const res = option.response;
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
    })
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/html'});
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
        const session = cookie.parse(req.headers.cookie || '');
        const username = post.sender || session.username;
        const password = post.password || session.password;
        const message = post.message;
        const imageData = post.imageData;

        db.postImage({
            sender: username,
            password: password,
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

module.exports = ChatController;