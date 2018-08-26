'use strict';

const mysql = require('mysql');

function ChatDB(option) {
    this.host = option.host || 'localhost';
    this.port = option.port || 3306;
    this.dbname = option.dbnmae;
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
ChatDB.prototype.postImage = function (option) {
    return this.post(option).then(id => {
        const imageData = option.data || '';
        const query = 'insert into chat.post_image (`post_id`, `type`, `data`) value (?, ?, ?)';
        return new Promise((resolve, reject) => {
            this.db.query(query, [id,'test', imageData], function (err, results) {
                if (!err) resolve(results.insertId);
                else reject(err);
            });
        });
    });
}
ChatDB.prototype.getArticles = function (option) {
    const query = 'select post.id, post.sender, post.message, post.created, post.updated, post_image.data as image from chat.post left join chat.post_image on post.id = post_image.post_id';
    return new Promise((resolve, reject) => {
        this.db.query(query, (err, results, fields) => {
            if (!err) resolve(results, fields);
            else reject(err);
        });
    });
}
/*
ChatDB.prototype.lastInsertID = function (option) {
    const query = 'select last_insert_id();'
    return new Promise((resolve, reject) => {
        this.db.query(query, (err, result, fields) => {
            if (!err) resolve(result);
            else reject(err);
        });
    });
}
*/
ChatDB.prototype.isExists = function (username) {
    const query = 'select * from chat.users where username = ?';
    return new Promise((resolve, reject) => {
        this.db.query(query, [username], function (err, results) {
            if (!err && results.some(v => v)) resolve();
            else      reject(err);
        })
    })
}
ChatDB.prototype.login = function (username, password) {
    return new Promise((resolve, reject) => {
        const query = 'select * from chat.users where chat.users.username = ?';
        this.db.query(query, [username], function (err, results, fileds) {
            if (err || !results.some(v => v)) reject(err);
            const bcrypt = require('bcrypt');
            const filtered = results.filter(v => bcrypt.compareSync(password, v.password));
            if (filtered.length === 1) resolve();
            else reject('ChatDB.prototype.login: user password not matched.');
        });
    });
}
ChatDB.prototype.createUser = function (username, password) {
    return new Promise((resolve, reject) => {
        this.isExists(username).then(() => reject('already exists user'));

        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        
        const query = 'insert into chat.users (`username`, `password`) value(?, ?)';
        this.db.query(query, [username, hashedPassword], function (err, results, fields) {
            if (!err) resolve();
            else reject(err);
        });
    });
}

module.exports = ChatDB;