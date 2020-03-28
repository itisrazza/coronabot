
/*!
 * CoronaBot -- Daemon spec.
 */

module.exports = require('daemonize2').setup({
    main: __dirname + '/coronication.js',
    name: 'coronication',
    pidfile: '/tmp/coronication.pid',
    group: 'www-data'
})