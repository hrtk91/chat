'use strict';
const path = require('path');
const http = require('http');
const mysql = require('mysql');
const app = require(path.join(process.cwd(), 'app.js'));

function cleanupDB(db) {
    const deleteQuerys = [
        'delete from chat.post_image;',
        'delete from chat.post;',
        'alter table chat.post_image auto_increment = 1;',
        'alter table chat.post auto_increment = 1;'
    ];
    const tasks = deleteQuerys.map(query => {
        return new Promise((resolve, reject) => {
            db.query(query, function (err, results) {
            if (err)
                reject(err);
            else    
                resolve(err);
            });
        });
    });
    return tasks;
}

describe('app.jsの検査', function () {
    var option = {};
    var db = null;
    const dbPostdataLength = 30;
    beforeAll(done => {
        option = {
            host: 'localhost',
            port: 8080,
            path: '/',
            method: 'GET',
        };
        db = mysql.createConnection({
            database: 'chat',
            host: 'localhost',
            port: 3306,
            user: 'node',
            password: 'node',
        });
        Promise.all(cleanupDB(db))
        .then(values => {
            const insertQuery = 'insert into chat.post (`sender`,`message`, `user_id`, `updated`) value (?, ?, ?, ?);'
            const tasks = [];
            for (var i = 0; i < dbPostdataLength; i++) {
                var p = new Promise((resolve, reject) => {
                    const date = new Date(Date.now() + (1000 * i));
                    db.query(insertQuery, ['testsender' + i.toString(), 'message' + i.toString(), 43, date], function (err, results) {
                        if (err)
                            reject(err);
                        else
                            resolve(results);
                    });
                });
                tasks.push(p);
            }
            Promise.all(tasks)
            .then(values => done());
        });
    });
    afterAll(done => {
        Promise.all(cleanupDB(db)).then(values => done());
    });
    describe('/articlesの取得順検査', function () {
        describe('/articles', function () {
            it('最新のポスト10件を取得する。', function (done) {
                option.path = '/articles';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            const expectOrder = dbPostdataLength-i;
                            expect(expectOrder).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?order=asc', function () {
            it('最古のポスト10件昇順で取得する。', function (done) {
                option.path = '/articles?order=asc';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            expect(i+1).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?order=desc', function () {
            it('最新のポスト10件を取得する。', function (done) {
                option.path = '/articles?order=desc';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            const expectOrder = dbPostdataLength-i;
                            expect(expectOrder).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?order=qwerty', function () {
            it('最新のポスト10件を取得する。', function (done) {
                option.path = '/articles?order=qwerty';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            const expectOrder = dbPostdataLength-i;
                            expect(expectOrder).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
    });

    describe('/articlesの取得順調査（起点ID指定）', function () {
        describe('/articles?originId=10', function () {
            it('ポストID10以降の最新ポスト10件を取得する。', function (done) {
                option.path = '/articles?originId=10';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            expect(20-i).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?originId=10&originOrder=new', function () {
            it('ポストID10からの最新のポスト10件を取得する。', function (done) {
                option.path = '/articles?originId=10&originOrder=new';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            expect(20-i).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?originId=10&originOrder=old', function () {
            it('ポストID10以前のポスト10件を取得する。', function (done) {
                option.path = '/articles?originId=10&originOrder=old';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            expect(10-i).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?originId=10&originOrder=qwerty', function () {
            it('ポストID10から10件取得する。', function (done) {
                option.path = '/articles?originId=10&originOrder=qwerty';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for(let i = 0; i < 10; i++) {
                            expect(20-i).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });
        describe('/articles?originId=aa&originOrder=new', function () {
            it('最新のポスト10件が取得される。', function (done) {
                option.path = '/articles?originId=aa&originOrder=new';
                option.method = 'GET';
                const req = http.request(option, function (res) {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        let data = JSON.parse(body);
                        expect(10).toBe(data.length);
                        for (let i = 0; i < 10; i++) {
                            expect(dbPostdataLength - i).toBe(data[i].id);
                        }
                        done();
                    });
                });
                req.end();
            });
        });


    });
});
