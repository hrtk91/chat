const fs = require('fs');
const path = require('path');
const Logger = require(path.join(process.cwd(), '/Models/Logger.js'));

describe('Logger.jsテスト', function () {
    describe('Logger.write', function () {
        const str = 'test word\r\n';
        const testFile = 'test.txt';
        
        beforeEach(done => {
            fs.exists(testFile, isExists => {
                if (!isExists) return done();
                fs.unlink(testFile, err => {
                    done();
                });
            });
        });

        function createTestFile() {
            return new Promise((resolve, reject) => {
                fs.writeFile(testFile, '', err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(testFile);
                    }
                });
            });
        }
        function chmod(file, mode = 0o666) {
            return new Promise((resolve, reject) => {
                fs.chmod(file, mode, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        it('通常', function (done) {
            const logger = new Logger(testFile);
            logger.write(str).then(() => {
                fs.readFile(path.resolve(testFile), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    expect(str).toBe(data);
                    done();
                });
            });
        });

        it('\\r\\n自動追記', function (done) {
            const logger = new Logger(testFile);
            logger.write('test word').then(() => {
                fs.readFile(path.resolve(testFile), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    expect('test word\r\n').toBe(data);
                    done();
                });
            });
        });

        it('文末\\r\\rの\\r\\n置換', function (done) {
            const logger = new Logger(testFile);
            logger.write('test word\r\r').then(() => {
                fs.readFile(path.resolve(testFile), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    expect('test word\r\n').toBe(data);
                    done();
                });
            });
        });

        it('文末\\n\\nの\\r\\n置換', function (done) {
            const logger = new Logger(testFile);
            logger.write('test word\n\n').then(() => {
                fs.readFile(path.resolve(testFile), 'utf8', function (err, data) {
                    if (err) {
                        throw err;
                    }
                    expect('test word\r\n').toBe(data);
                    done();
                });
            });
        });

        it('書き込みタイムアウト確認', done => {
            createTestFile()
            .then(_ => chmod(testFile, 0o444))
            .then(_ => {
                const logger = new Logger(testFile);
                let retry = 0;
                logger.on('retryed', _ => retry++);
                logger.write(str, 5).catch(err => {
                    expect(5).toBe(retry);
                    expect('').toBe(fs.readFileSync(testFile, 'utf8'));
                    done();
                });
            });
        });
    });
});
