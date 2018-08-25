'use strict';

function Rooter() {
    this._listener = [];
}

Rooter.prototype.on = function (type, callback) {
    let listener = this._listener;
    if (listener[type] === undefined) {
        if (callback !== undefined) {
            listener[type] = callback;
        } else {
            return new Promise(resolve => listener[type] = resolve);
        }
    } else {
        throw 'already pushed';
    }
    
    return this;
}
Rooter.prototype.off = function (type) {
    let listener = this._listener;
    if (listener[type] !== undefined) {
        lsitener[type] = undefined;
    }

    return this;
}
Rooter.prototype.fire = function (type, option) {
    let listener = this._listener;
    option = option || {};
    if (listener[type] !== undefined) {
        listener[type](option);
    }

    return this;
}

module.exports = Rooter;
