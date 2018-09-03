const path = require('path');
const ChatDB = require(path.join(process.cwd(), 'Models', 'ChatDB.js'));

describe('ChatDB.js', () => {
    describe('ChatDB.post', () => {
        beforeEach(() => {
            this.db = new ChatDB({
                host: 'localhost',
                port: 3306,
                dbname: 'chat',
                user: 'node',
                password: 'node',
            });
            this.db.connect();
        });
        it('DBに値を正常登録する', done => {
            this.db.post({
                sender: 'aaaa',
                password: 'aaaa',
                message: 'test',
            })
            .then(id => {
                return this.db.getArticles()
            })
            .then(results => {
                expect(results[0].message).toBe('test');
                done();
            });
        });
        it('ユーザが不明', done => {
            this.db.post({
                sender: 'unknown',
                password: 'aaaa',
                message: 'test',
            })
            .then(id => {
                fail('post succssed');
                done();
            })
            .catch(err => {
                done();
            });
        });
        it('パスワード不一致', done => {
            this.db.post({
                sender: 'aaaa',
                password: 'bbbb',
                message: 'test',
            })
            .then(id => {
                fail('post succssed');
                done();
            })
            .catch(err => {
                done();
            })
        });
    });
    describe('ChatDB.postCount', () => {

    });
    describe('ChatDB.postImage', () => {

    });
    describe('ChatDB.getArticles', () => {

    });
    describe('ChatDB.isExists', () => {

    });
    describe('ChatDB.login', () => {

    });
    describe('ChatDB.createUser', () => {

    });
});