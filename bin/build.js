var fs = require('fs');
var path = require('path');
var parser = require('uglify-js').parser;
var uglify = require('uglify-js').uglify;
var config = require('./config');
var version = require('../package.json').version;

exports.minify = function (input) {
  var ast = uglify.ast_squeeze(uglify.ast_mangle(parser.parse(input)));
  return uglify.gen_code(ast);
};

exports.getInput = function (name) {
  var files = config[name];
  return files.map(function (filename) {
    return fs.readFileSync(path.join(__dirname, '..', filename), 'utf-8');
  }).join('\n');
};

exports.build = function (name, withVersion, minify) {
  var unminified = exports.getInput(name);
  var output = minify ? exports.minify(unminified) : unminified;
  var filename = withVersion ? name + '-' + version: name;
  filename += (minify ? '.min.js': '.js');
  var folder = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  fs.writeFileSync(path.join(folder, filename), output, 'utf-8');
};

exports.build('datav');
exports.build('deps');
exports.build('data_shu');
exports.build('data_mofang');
exports.build('stream_component');
exports.build('all');