const fs = require('fs');
const path = require('path');

function Logger(filename = '', interval = 200) {
    this.filepath = path.resolve(filename);
    this.interval = interval;
}
Logger.prototype = Object.create(require('events').prototype);
Logger.prototype.delay = function delay(timer) {
    return new Promise(resolve => {
        setTimeout(_ => {
            resolve();
        }, timer);
    });
}
Logger.prototype.delayedWrite = function delayedWrite(timer, body, retry) {
    return this.delay(timer).then(_ => this.write(body, retry));
}
Logger.prototype.write = function write(body, retry = 5) {
    return new Promise((resolve, reject) => {
        fs.appendFile(this.filepath, body, err => {
            if (err) {
                console.error('Logger.write: start retry ' + retry.toString() + '. body = "' + body + '", Error = "' + err.message + '"');
                if (retry <= 0) {
                    reject(new Error('Logger.write: retry count zero. body = "' + body + '"'));
                } else {
                    this.emit('retryed');
                    this.delayedWrite(this.interval, body, --retry).then(resolve).catch(reject);
                }
            } else {
                resolve();
            }
        });
    });
}

Logger.prototype.close = function close() {
    this.tasks.forEach(timerId => {
        clearTimeout(timerId);
    });
}

module.exports = Logger;
