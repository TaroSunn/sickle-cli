
'use strict'

const Mongodb = require('./mongodb')

const {mongodbUrl, mongodbDbName} = require('../../config/db')

function mongo() {
    return new Mongodb(mongodbUrl, mongodbDbName)
}

module.exports = mongo