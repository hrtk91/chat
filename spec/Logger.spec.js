const fs = require('fs');
const path = require('path');
const Logger = require(path.join(process.cwd(), '/Models/Logger.js'));

describe('Logger.jsテスト', function () {
    describe('write', function () {
        const testFile = 'test.txt';
        
        beforeAll(done => {
            fs.unlink(testFile, function (err) {
                if (err) {
                    console.log('beforeAll error.');
                } else {
                    done();
                }
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
    });
});
