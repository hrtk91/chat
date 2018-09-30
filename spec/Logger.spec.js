const fs = require('fs');
const path = require('path');
const Logger = require(path.join(process.cwd(), '/Models/Logger.js'));

describe('Logger.jsテスト', function () {
    describe('Logger.write', function () {
        const testFile = 'test.txt';
        
        beforeEach(done => {
            fs.exists(testFile, isExists => {
                if (!isExists) return done();
                fs.unlink(testFile, function (err) {
                    done();
                });
            });
        });

        it('通常', function (done) {
            const str = 'test word';
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

        it('書き込み権限制限ファイルに書き込み', function (done) {
            const str = 'test word';
            new Promise((resolve, reject) => {
                fs.writeFile(testFile, '', err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            })
            .then(_ => {
                return new Promise((resolve, reject) => {
                    fs.chmod(testFile, 0o444, err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            })
            .then(_ => {
                const logger = new Logger(testFile);
                let retry = 0;
                logger.on('retryed', function retryed() {
                    if (retry < 1) {
                        retry++;
                        return;
                    }
                    fs.chmod(testFile, 0o666, err => {
                        if (err) return console.log(err);
                        logger.removeListener('retryed', retryed);
                    });
                });
                logger.write(str).then(_ => {
                    fs.readFile(testFile, 'utf8', (err, data) => {
                        expect(1).toBe(retry);
                        expect(str).toBe(data);
                        done();
                    });
                });
            });
        });
    });
});
