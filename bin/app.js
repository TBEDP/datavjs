var path = require('path');
var connect = require('connect');

var app = connect();
app.use(connect.static(path.join(__dirname, "../")));
app.use(connect.directory(path.join(__dirname, "../")));
app.listen(8001);
console.log("Running at http://localhost:8001");

