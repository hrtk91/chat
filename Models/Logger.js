const fs = require('fs');
const path = require('path');

function Logger(filename) {
    this.filepath = path.resolve(filename);
    this.interval = 200;
    this.timers = [];
}

Logger.prototype.write = function write(body) {
    return new Promise(resolve => {
        fs.appendFile(this.filepath, body, (err) => {
            if (err) {
                const id = setTimeout(() => {
                    this.write(body);
                    const idx = this.timers.indexOf(id);
                    if (idx !== -1) {
                        this.timers.slice(idx, 1);
                    }
                }, this.interval);
                this.timers.push(id);
                return;
            }
            resolve();
        });
    });
}

Logger.prototype.close = function close() {
    this.timers.forEach(timerId => {
        clearTimeout(timerId);
    });
}

module.exports = Logger;
