const fs = require('fs');
const path = require('path');
const OS = require('os');

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
    if (!(/(\r\n|\r|\n)$/.test(body))) {
        body += OS.EOL;
    } else if (/(\r+\n+|\r+|\n+)$/.test(body)) {
        body = body.replace(/(\r+\n+|\r+|\n+)$/, '\r\n');
    }

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

Logger.prototype.info = function info(body = '') {
    const log = '[info:' + (new Date()) + ']' + body;
    console.info(log);
    this.write(log).catch(err => console.error(err.message));
}

Logger.prototype.warn = function warn(body = '') {
    const log = '[warn:' + (new Date()) + ']' + body;
    console.warn(log);
    this.write(log).catch(err => console.error(err.message));
}

Logger.prototype.error = function error(body = '') {
    const log = '[error:' + (new Date()) + ']' + body;
    console.error(log);
    this.write(log).catch(err => console.error(err.message));
}

module.exports = Logger;
