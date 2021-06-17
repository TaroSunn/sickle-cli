const request = require('@sickle/cli-request')

module.exports = function() {
    return request({
        url: '/project/template'
    })
}