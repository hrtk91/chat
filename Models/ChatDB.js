'use strict';

const mysql = require('mysql');

function ChatDB(option) {
    this.host = option.host || 'localhost';
    this.port = option.port || 3306;
    this.dbname = option.dbname;
    this.user = option.user;
    this.password = option.password;
    this.db = null;
}
ChatDB.prototype.connect = function () {
    return new Promise((resolve, reject) => {
        this.db = mysql.createConnection({
            host: this.host || 'localhost',
            port: this.port || 3306,
            user: this.user,
            password: this.password,
            database: this.dbname
        });
        this.db.connect(function (err) {
            if (!err) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
}
ChatDB.prototype.post = function (option) {
    const username = option.sender || '';
    const password = option.password || '';
    const message = option.message || '';
    const query = 'insert into chat.post (`sender`,`message`, `user_id`) value (?, ?, ?);';
    return this.login(username, password).then(id => { 
        return new Promise((resolve, reject) => {
            this.db.query(query, [username, message, id], function (err, results) {
                if (!err) {
                    resolve(results.insertId);
                } else {
                    reject(err);
                }
            });
        });
    });
}
ChatDB.prototype.postCount = function (option) {
    const query = 'select count(*) from chat.post';
    return new Promise((resolve, reject) => {
        this.db.query(query, function (err, results, fileds) {
            if (!err) {
                const count = results[0].count;
                resolve(count);
            }
            else {
                reject(err || new Error('postCount is 0.'));
            }
        })
    })
}
ChatDB.prototype.postImage = function (option) {
    return this.post(option).then(id => {
        const imageData = option.data || '';
        const query = 'insert into chat.post_image (`post_id`, `type`, `data`) value (?, ?, ?)';
        return new Promise((resolve, reject) => {
            this.db.query(query, [id, '', imageData], function (err, results) {
                if (!err) {
                    resolve(results.insertId);
                } else {
                    reject(err);
                }
            });
        });
    });
}
ChatDB.prototype.getArticles = function (option) {
    option = option || {};
    const originId = isFinite(option.originId) ? Math.abs(option.originId) : 0;
    const timeseries = (option.timeseries === 'old') ? 'old' : 'new'; 
    const order = (option.order === 'asc') ? 'asc' : 'desc';
    const num = (isFinite(option.num) ? Math.abs(option.num) : 0) || 10;

    const querys = [
        'select post.id, post.sender, post.message, post.created, post.updated, post_image.data as image from chat.post left join chat.post_image on post.id = post_image.post_id '
    ];
    
    if (timeseries === 'new') {
        querys.push('where post.id > ? ');
    } else if (timeseries === 'old') {
        querys.push('where post.id < ? ');
    }

    if (originId !== 0 && timeseries === 'new') {
        querys.push('and post.id <= ' + (originId + num).toString() + ' ');
    } else if (originId !== 0 && timeseries === 'old') {
        querys.push('and post.id >= ' + (originId - num).toString() + ' ');
    }

    if (order === 'asc') {
        querys.push('order by post.updated asc ');
    } else {
        querys.push('order by post.updated desc ');
    }

    querys.push('limit ?');

    const query = querys.reduce((pq, cq) => pq + cq);
    return new Promise((resolve, reject) => {
        this.db.query(query, [originId, num], (err, results, fields) => {
            if (!err) {
                resolve(results, fields);
            } else {
                err = err || new Error('Articles cant find.');
                err.query = query;
                reject(err);
            }
        });
    });
}
ChatDB.prototype.getlatestArticle = function () {
    const query = 'select id from chat.post order by post.id desc';
    return new Promise((resolve, reject) => {
        this.db.query(query, (err, results, fields) => {
            if (err) {
                return reject(err);
            }

            const article = results[0];
            resolve(article);
        });
    });
}
ChatDB.prototype.isExists = function (username) {
    return new Promise((resolve, reject) => {
        const query = 'select * from chat.users where username = ?';
        this.db.query(query, [username], function (err, results) {
            if (!err && results.some(v  => v.username)) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
    });
}
ChatDB.prototype.login = function (username, password) {
    return new Promise((resolve, reject) => {
        const query = 'select * from chat.users where users.username = ?';
        this.db.query(query, [username], function (err, results, fileds) {
            if (err) {
                return reject(err || new Error('ChatDB.login: query error.'));
            }

            if (results.length <= 0) {
                return reject(new Error('ChatDB.login: user password not matched.'));
            }

            const result = results[0];
            const bcrypt = require('bcrypt');
            if (bcrypt.compareSync(password, result.password)) {
                resolve(result.id);
            } else {
                reject(new Error('ChatDB.login: password not match.'));
            }
        });
    });
}
ChatDB.prototype.createUser = function (username, password) {
    return this.isExists(username)
    .then(result => {
        if (result === true) {
            throw new Error(`${username} is already exists.`);
        }

        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        const query = 'insert into chat.users (`username`, `password`) value(?, ?)';
        return new Promise((resolve, reject) => {
            this.db.query(query, [username, hashedPassword], function (err, results, fields) {
                if (!err) {
                    Logger.info('user ' + username + ' created!');
                    resolve();
                }
                else {
                    reject(new Error('user ' + username + ' create have failed.'));
                }
            });
        });
    });
}

module.exports = ChatDB;