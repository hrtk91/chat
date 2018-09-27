'use strict';

function Rooter() {
    this.listener = {};
    this.validations = {};
}

Rooter.prototype.on = function on(type) {
    var validator;
    var callback;
    if (typeof(arguments[1]) === 'function' && typeof(arguments[2]) === 'function') {
        validator = arguments[1];
        callback = arguments[2];
    } else if (typeof(arguments[2]) !== 'function' && typeof(arguments[1]) === 'function') {
        callback = arguments[1];
    } else {
        throw new Error('Argument exception');
    }

    const validations = this.validations;
    const listener = this.listener;

    if (typeof(validator) === 'function')
        validations[type] = validator;
    else
        validations[type] = undefined;

    listener[type] = callback;

    return this;
}
Rooter.prototype.off = function off(type) {
    const validations = this.validations;
    const listener = this.listener;

    if (validations[type] !== undefined)
        validations[type] = undefined;
    if (listener[type] !== undefined)
        listener[type] = undefined;

    return this;
}
Rooter.prototype.fire = function fire(type, option) {
    const validator = this.validations[type];
    const listener = this.listener[type];
    option = option || {};

    if (typeof(listener) !== 'function') {
        if (this.defaultfunc)
            this.defaultfunc(option);
        return this;
    }
    
    if (typeof(validator) !== 'function') {
        listener(option);
        return this;
    }

    const canExecuteCbk = validator(option);
    if (canExecuteCbk)
        listener(option);

    return this;
}

Rooter.prototype.defaultRooting = function defaultRooting(defaultfunc) {
    if (typeof(defaultfunc) === 'function')
        this.defaultfunc = defaultfunc;
    
    return this;
}

module.exports = Rooter;
