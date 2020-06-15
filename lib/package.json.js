
const fs = require("fs");
const path = require("path");

module.exports = exports = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "..", "package.json")
    )
);
