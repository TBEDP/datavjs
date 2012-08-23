var JSLINT = require('./jslint.js');
var fs = require('fs');

var a = process.argv;
var e, i, input;
if (!a[2]) {
    console.log("Usage: node precommit.js file.js");
    process.exit(1);
}
input = fs.readFileSync(a[2], "utf-8");
if (!input) {
    console.log("jslint: Couldn't open file '" + a[2] + "'.");
    process.exit(1);
}
if (!JSLINT(input, require("./config.json"))) {
    console.log('');
    for (i = 0; i < JSLINT.errors.length; i += 1) {
        e = JSLINT.errors[i];
        if (e) {
            console.log('Lint at line ' + e.line + ' character ' +
                    e.character + ': ' + e.reason);
            console.log((e.evidence || '').
                    replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"));
            console.log('');
        }
    }
    process.exit(2);
} else {
    console.log("jslint: No problems found in " + a[0]);
    process.exit();
}
