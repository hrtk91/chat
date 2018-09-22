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
        Promise.all(cleanupDB(db)).then(done);
    });
    afterAll(done => {
        Promise.all(cleanupDB(db)).then(done);
    });
    describe('/articlesテスト', function () {
        beforeAll(done => {
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
            .then(done);
        });
        describe('/articlesの取得順テスト(order指定)', function () {
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
        describe('/articlesの取得順テスト（originId,timeseries指定）', function () {
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
            describe('/articles?originId=10&timeseries=new', function () {
                it('ポストID10からの最新のポスト10件を取得する。', function (done) {
                    option.path = '/articles?originId=10&timeseries=new';
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
            describe('/articles?originId=10&timeseries=old', function () {
                it('ポストID10以前のポスト10件を取得する。', function (done) {
                    option.path = '/articles?originId=10&timeseries=old';
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
            describe('/articles?originId=10&timeseries=qwerty', function () {
                it('ポストID10からの最新10件取得する。', function (done) {
                    option.path = '/articles?originId=10&timeseries=qwerty';
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
            describe('/articles?originId=aa&timeseries=new', function () {
                it('最新のポスト10件が取得される。', function (done) {
                    option.path = '/articles?originId=aa&timeseries=new';
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
        describe('/articlesの取得数テスト(num指定)', function () {
            describe('./articles?num=20', function () {
                it('取得件数が20件', function (done) {
                    option.path = '/articles?num=20';
                    option.method = 'GET';
                    const req = http.request(option, function (res) {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            let data = JSON.parse(body);
                            expect(20).toBe(data.length);
                            done();
                        });
                    });
                    req.end();
                });
            });
            describe('./articles?num=30', function () {
                it('取得件数が30件', function (done) {
                    option.path = '/articles?num=30';
                    option.method = 'GET';
                    const req = http.request(option, function (res) {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            let data = JSON.parse(body);
                            expect(30).toBe(data.length);
                            done();
                        });
                    });
                    req.end();
                });
            });
            describe('./articles?num=31', function () {
                it('取得件数が30件', function (done) {
                    option.path = '/articles?num=31';
                    option.method = 'GET';
                    const req = http.request(option, function (res) {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            let data = JSON.parse(body);
                            expect(30).toBe(data.length);
                            done();
                        });
                    });
                    req.end();
                });
            });
            describe('./articles?num=0', function () {
                it('取得件数が10件', function (done) {
                    option.path = '/articles?num=0';
                    option.method = 'GET';
                    const req = http.request(option, function (res) {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            let data = JSON.parse(body);
                            expect(10).toBe(data.length);
                            done();
                        });
                    });
                    req.end();
                });
            });
            describe('./articles?num=aa', function () {
                it('取得件数が10件', function (done) {
                    option.path = '/articles?num=aa';
                    option.method = 'GET';
                    const req = http.request(option, function (res) {
                        let body = '';
                        res.on('data', chunk => body += chunk);
                        res.on('end', () => {
                            let data = JSON.parse(body);
                            expect(10).toBe(data.length);
                            done();
                        });
                    });
                    req.end();
                });
            });
        });
    });
    describe('/articleテスト', function () {
        beforeEach(done => Promise.all(cleanupDB(db)).then(done));
        afterEach(done => Promise.all(cleanupDB(db)).then(done));
        describe('./article通常ケース', function () {
            describe('./article', function () {
                it('通常投稿', function (done) {
                    const postData = JSON.stringify({
                        sender: 'aaaa',
                        password: 'aaaa',
                        message: 'test'
                    });
                    option.path = '/article';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(201).toBe(res.statusCode);
                        db.query('select * from chat.post limit 100;', function (err, results) {
                            const article = results[0];
                            expect(1).toBe(article.id);
                            expect('aaaa').toBe(article.sender);
                            expect('test').toBe(article.message);
                            done();
                        });
                    });
                });
                it('存在しないユーザ', function (done) {
                    const postData = JSON.stringify({
                        sender: 'unknown',
                        password: 'unknown',
                        message: 'test'
                    });
                    option.path = '/article';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(500).toBe(res.statusCode);
                        db.query('select * from chat.post limit 100;', function (err, results) {
                            expect(0).toBe(results.length);
                            done();
                        });
                    });
                });
                it('パスワード間違い', function (done) {
                    const postData = JSON.stringify({
                        sender: 'aaaa',
                        password: 'unknown',
                        message: 'test'
                    });
                    option.path = '/article';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(500).toBe(res.statusCode);
                        db.query('select * from chat.post limit 100;', function (err, results) {
                            expect(0).toBe(results.length);
                            done();
                        });
                    });
                });
                it('255文字投稿', function (done) {
                    const message = [...Array(255).keys()].map((v, i) => 'a').join('');
                    const postData = JSON.stringify({
                        sender: 'aaaa',
                        password: 'aaaa',
                        message: message
                    });
                    option.path = '/article';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(201).toBe(res.statusCode);
                        db.query('select * from chat.post limit 100;', function (err, results) {
                            expect(message).toBe(results[0].message);
                            done();
                        });
                    });
                });
                it('256文字投稿', function (done) {
                    const message = [...Array(256).keys()].map((v, i) => 'a').join('');
                    const postData = JSON.stringify({
                        sender: 'aaaa',
                        password: 'aaaa',
                        message: message
                    });
                    option.path = '/article';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(500).toBe(res.statusCode);
                        db.query('select * from chat.post limit 100;', function (err, results) {
                            expect(0).toBe(results.length);
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('/imageテスト', function () {
        beforeEach(done => Promise.all(cleanupDB(db)).then(done));
        afterEach(done => Promise.all(cleanupDB(db)).then(done));
        describe('/image通常ケース', function () {
            describe('/image', function () {
                it('通常投稿', function (done) {
                    const postData = JSON.stringify({
                        sender: 'aaaa',
                        password: 'aaaa',
                        message: 'test',
                        imageData: 'TEST'
                    });
                    option.path = '/image';
                    option.headers = {
                        'Content-Type': 'application/json',
                        'Content-Length': postData.length,
                    };
                    option.method = 'POST';
                    new Promise((resolve, reject) => {
                        const req = http.request(option, resolve);
                        req.on('error', reject);
                        req.write(postData);
                        req.end();
                    })
                    .then(res => {
                        expect(201).toBe(res.statusCode);
                        db.query('select * from chat.post left join chat.post_image on post.id = post_image.post_id limit 100;', function (err, results) {
                            const article = results[0];
                            expect(1).toBe(article.id);
                            expect('aaaa').toBe(article.sender);
                            expect('test').toBe(article.message);
                            expect('TEST').toBe(article.data);
                            done();
                        });
                    });
                });
            });
        });
    });
    describe('/user/loginテスト', function () {
        describe('/user/login', function () {
            it('通常ケース',  done => {
                const postData = JSON.stringify({
                    sender: 'aaaa',
                    password: 'aaaa',
                });
                option.path = '/user/login';
                option.headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length,
                };
                option.method = 'POST';
                new Promise((resolve, reject) => {
                    const req = http.request(option, resolve);
                    req.on('error', reject);
                    req.write(postData);
                    req.end();
                })
                .then(res => {
                    expect(200).toBe(res.statusCode);
                    done();
                });
            });
        });
    });
    describe('/user/createテスト', function () {
        beforeEach(done => {
            db.query('delete from chat.users where users.username = "foo";', done);
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });
        afterEach(done => {
            db.query('delete from chat.users where users.username = "foo";', done);
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
        });
        it('ユーザfoo作成', done => {
            const postData = JSON.stringify({
                username: 'foo',
                password: 'foo',
            });
            option.headers = {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
            };
            option.path = '/user/create';
            option.method = 'POST';
            new Promise((resolve, reject) => {
                const req = http.request(option, resolve);
                req.on('error', reject);
                req.write(postData);
                req.end();
            })
            .then(res => {
                const post = JSON.parse(postData);
                expect(201).toBe(res.statusCode);
                db.query('select * from chat.users where users.username = ?;',
                    post.username,
                    function (err, results) {
                        expect(post.username).toBe(results[0].username);
                        done();
                    }
                );
            });
        });
    });
    describe('ルーティングテスト', function () {
        it('/../app.js', done => {
            option.path = '/../app.js';
            new Promise((resolve, reject) => {
                const req = http.request(option, resolve);
                req.on('error', reject);
                req.end();
            })
            .then(res => {
                expect(403).toBe(res.statusCode);
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    expect('403 Forbidden.').toBe(body);
                    done();
                });
            });
        });
        it('/..\\app.js', done => {
            option.path = '/..\\app.js';
            new Promise((resolve, reject) => {
                const req = http.request(option, resolve);
                req.on('error', reject);
                req.end();
            })
            .then(res => {
                expect(403).toBe(res.statusCode);
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    expect('403 Forbidden.').toBe(body);
                    done();
                });
            });
        });
    });
});
