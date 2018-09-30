const fs = require('fs');
const path = require('path');

function Logger(filename, interval) {
    filename = filename || '';
    interval = interval || 200;
    this.filepath = path.resolve(filename);
    this.interval = interval;
    this.tasks = [];
}
Logger.prototype = Object.create(require('events').prototype);
Logger.prototype.write = function write(body) {
    return new Promise((resolve, reject) => {
        fs.appendFile(this.filepath, body, err => {
            if (err) {
                console.error('Logger.write: start retry. body = "' + body + '", Error = "' + err.message + '"');
                new Promise(fullfilled => {
                    const id = setTimeout(() => {
                        fullfilled(id);
                    }, this.interval);
                    const task = {
                        timeoutId: id,
                        body: body,
                        retry: 0,
                        limit: 5,
                    };
                    this.tasks.push(task);
                })
                .then(timeoutId => {
                    const idx = this.tasks.map(t => t.timeoutId).indexOf(timeoutId);
                    if (idx === -1) {
                        reject(new Error('Logger.write: exception in retry.'));
                    }
                    const task = this.tasks[idx];
                    this.tasks.slice(idx, 1);
                    if (task.retry++ < task.limit) {
                        this.emit('retryed', task);
                        this.write(body).then(resolve);
                    } else {
                        reject(new Error('Logger.write: exceeded retry limit. body = "' + task.body + '"'));
                    }
                });
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
