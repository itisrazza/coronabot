
var daemon = require('./covid19-daemon')
daemon.stop(() => console.log('Bot daemon started'))
