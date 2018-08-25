'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const cookie = require('cookie');
const Rooter = require('./Rooter.js');
const ChatDB = require('./ChatDB.js');

const db = new ChatDB({
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

http.createServer(main).listen(8080);

function main(req, res) {
    let query = url.parse(req.url, true);
    let pathname = query.pathname;
    let filepath = path.join(__dirname, pathname);
    let ext = path.extname(filepath);
    
    console.log('requested:' + req.connection.remoteAddress + '@' + filepath);

    if (ext && fs.existsSync(filepath) === true) {
        setHeaderFromExtension(ext, res);
        writeResponse(filepath, res);
        return;
    }

    // apiへのルーティングコード書くこと
    const rooter = new Rooter();

    rooter.on('/')
    .then(option => {
        let filepath = path.join(__dirname, 'index.html');
        res.writeHead(200, {'Content-Type': 'text/html'});
        writeResponse(filepath, res);
    });

    rooter.on('/user/create')
    .then(option => {
        if (req.method !== 'POST') {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('400 Bad Request. Please use POST method.');
            throw new Error('bad request');
        }

        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk;
                if (body >= 1e6) { req.connection.destroy(); reject('データサイズが大きすぎます。'); }
            })
            .on('error', err => {
                reject(err);
            })
            .on('end', () => {
                const data = JSON.parse(body);
                option.data = data;
                resolve(option);
            });
        });
    })
    .then(option => {
        const username = option.username;
        const password = option.password;
        return db.createUser(username, password);
    })
    .then(() => {
        res.writeHead(201, {'Content-Type': 'application/json'});
        res.end();
    })
    .catch(err => {
        if ('bad request' !== err) throw err;
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });

    rooter.on('/user/login')
    .then(option => {
        if (req.method !== 'GET') {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('400 Bad Request. Please use GET method.');
            throw new Error('bad request');
        }

        let session = cookie.parse(req.headers.cookie);
        const username = session.username;
        const password = session.password;

        return db.login(username, password);
    })
    .then(() => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end();
    })
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });

    rooter.on('/article')
    .then(option => {
        if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk;
                // 1e6 = 10^6 = 1MB
                if (body >= 1e6) req.connection.destroy();
            });
            req.on('error', (err) => {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('500 Server Internal Error.');
                console.error(err.message);
            });
            req.on('end', () => {
                const post = JSON.parse(body);

                let session = cookie.parse(req.headers.cookie);
                const username = session.username;
                const password = session.password;
        
                db.login(username, password)
                .then(results => {
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

                /*
                const dbpath = path.join(__dirname, 'articles.csv');
                const subject = post.sender + ',' + post.message + ',' + Date.now() + '\r\n';
                fs.appendFile(
                    dbpath,
                    subject,
                    err => {
                        if (!err) {
                            res.writeHead(201, {'Content-Type': 'application/json'});
                            res.end();
                            console.info('post data received');
                            console.info(post);
                        } else {
                            res.writeHead(500, {'Content-Type': 'text/plain'});
                            res.end('500 Server Internal Error.');
                            console.error(err.message);
                        }
                    }
                );
                */
            });
        } else {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('400 Bad Request. Please use POST or PUT method.');
        }
    });

    rooter.on('/articles')
    .then(option => {
        if (req.method !== 'GET') {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('400 Bad Request. Please use GET method.');
            return;
        }

        return db.getArticles();

        /*
        const csvpath = path.join(__dirname, 'articles.csv');
        return new Promise((resolve, reject) => {
            fs.readFile(csvpath, 'utf8', (err, data) => {
                if (!err)
                    resolve(data);
                else
                    reject(err);
            });
        });
        */
    })
    .then((results, fields) => {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(results));
    })
    /*
    .then(data => {
        const table = data
            .split('\r\n')
            .filter(line => line !== '')
            .map((line, idx, ary) => {
                const first = ary[0].split(',');
                const column = line.split(',');
                let obj = {};
                column.forEach((val, i) => obj[first[i]] = val);
                return obj;
            })
            .splice(1);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(table));
    })
    */
    .catch(err => {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('500 Server Internal Error.');
        console.error(err);
    });

    rooter.on('/image')
    .then(option => {
        const req = option.request || {};
        const res = option.response || {};

        if (req.method !== 'POST') {
            res.writeHead(400, { 'Content-Type:': 'text/plain' });
            res.end('400 Bad Request. Please use POST method.');
            return;
        }

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

            /*
            const subject = user + ',' + message + ',' + create + ',' + imageData + '\r\n';

            const csvpath = path.join(__dirname, 'articles.csv');
            fs.appendFile(
                csvpath,
                subject,
                err => {
                    if (!err) {
                        res.writeHead(201, {'Content-Type': 'application/json'});
                        res.end();
                        console.info(post);
                    } else {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('500 Server Internal Error.');
                        console.error(err);
                    }
                }
            );
            */
        });
    });

    const apicode = pathname;
    rooter.fire(apicode, {
        request: req,
        response: res
    });
    // ここまで
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

