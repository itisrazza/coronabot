
/*!
 * CoronaBot -- Daemon start script.
 */

var daemon = require("./covid19-daemon");
daemon.start(() => console.log("Bot daemon started"));
