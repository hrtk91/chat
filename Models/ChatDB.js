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
            if (!err) resolve();
            else reject(err);
        });
    });
}
ChatDB.prototype.post = function (option) {
    const sender = option.sender || 'user';
    const message = option.message || '';
    const query = 'insert into chat.post (`sender`,`message`, `user_id`) value (?, ?, ?);';
    return this.isExists(option.sender).then(() => { 
        return new Promise((resolve, reject) => {
            this.db.query(query, [sender, message, 1], function (err, results) {
                if (!err) resolve(results.insertId);
                else      reject(err);
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
                if (!err) resolve(results.insertId);
                else reject(err);
            });
        });
    });
}
ChatDB.prototype.getArticles = function (option) {
    // asc or desc
    option = option || {};
    const originId = (option.originId ? Math.abs(option.originId) : 0);
    const originOrder = option.originOrder ? (option.originOrder === 'new' ? '>=' : '<=') : '>=';
    const order = 
        option.order ? (option.order === 'asc' ? 'asc' : 'desc')
        : 'desc';
    const num = (option.num ? Math.abs(option.num) : 0) || 10;
    const querys = [
        'select post.id, post.sender, post.message, post.created, post.updated, post_image.data as image from chat.post left join chat.post_image on post.id = post_image.post_id ',
        'where post.id ' + originOrder + ' ? ',
        'order by post.updated ' + order + ' ',
        'limit ? ',
    ];
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
ChatDB.prototype.isExists = function (username) {
    return new Promise((resolve, reject) => {
        const query = 'select * from chat.users where username = ?';
        this.db.query(query, [username], function (err, results) {
            if (!err && results.some(v  => v.username))
                resolve(true);
            else
                resolve(false);
        })
    });
}
ChatDB.prototype.login = function (username, password) {
    return new Promise((resolve, reject) => {
        const query = 'select * from chat.users where chat.users.username = ?';
        this.db.query(query, [username], function (err, results, fileds) {
            if (err || !results.some(v => v))
                return reject(err || new Error('ChatDB.login: query error.'));

            const bcrypt = require('bcrypt');
            if (bcrypt.compareSync(password, results[0].password))
                resolve();
            else
                reject('ChatDB.prototype.login: user password not matched.');
        });
    });
}
ChatDB.prototype.createUser = function (username, password) {
    return this.isExists(username)
    .then(result => {
        if (result === true) throw new Error(`${username} is already exists.`);

        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        const query = 'insert into chat.users (`username`, `password`) value(?, ?)';
        this.db.query(query, [username, hashedPassword], function (err, results, fields) {
            if (!err)  {
                console.info('user ' + username + ' created!');
            } else {
                throw new Error('user ' + username + ' create have failed.');
            }
        });
    });
}

module.exports = ChatDB;