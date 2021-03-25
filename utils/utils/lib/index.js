'use strict';

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}
function spinnerStart(msg) {
    const Spinner = require('cli-spinner').Spinner

    const spinner = new Spinner( msg + ' %s')
    spinner.setSpinnerString('|/-\\')
    spinner.start()
    return spinner
}

function sleep() {
    return new Promise(resolve => setTimeout(resolve, 1000))
}

module.exports = {
    isObject,
    spinnerStart,
    sleep
};