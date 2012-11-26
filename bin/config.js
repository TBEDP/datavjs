exports.deps = [
  'deps/array_shim.js',
  'deps/json2.js',
  'deps/d3.v2.js',
  'deps/raphael.js',
  'deps/eventproxy-0.2.0.js',
  'deps/jquery-1.7.1.js',
  'deps/underscore-1.4.2.js'
];

exports.datav = exports.deps.concat([
  'lib/datav.js'
]);

exports.without = function (excludes) {
  return exports.datav.filter(function (filename) {
    return excludes.indexOf(filename) === -1;
  });
};

exports.datav_without_jquery = exports.without([
  'deps/jquery-1.7.1.js'
]);

exports.data_html5 = exports.without([
  'deps/array_shim.js',
  'deps/json2.js'
]);

exports.data_shu = exports.without([
  'deps/raphael.js',
  'deps/eventproxy-0.2.0.js',
  'deps/jquery-1.7.1.js',
  'deps/underscore-1.4.2.js'
]);

exports.data_mofang = exports.without([
  'deps/raphael.js',
  'deps/underscore-1.4.2.js',
  'deps/jquery-1.7.1.js'
]);

exports.all = exports.datav.concat([
  'lib/charts/axis.js',
  'lib/charts/brush.js',
  'lib/charts/bubble.js',
  'lib/charts/bullet.js',
  'lib/charts/bundle.js',
  'lib/charts/chord.js',
  'lib/charts/diff.js',
  'lib/charts/flow.js',
  'lib/charts/force.js',
  'lib/charts/column.js',
  'lib/charts/matrix.js',
  'lib/charts/parallel.js',
  'lib/charts/pie.js',
  'lib/charts/scatterplotMatrix.js',
  'lib/charts/stream.js',
  'lib/charts/tree.js',
  'lib/charts/treemap.js',
  'lib/charts/chinamap.js'
]);

exports.stream_component = [
  'lib/charts/axis.js',
  'lib/charts/stream_axis.js',
  'lib/charts/legend.js',
  'lib/charts/navi.js',
  'lib/charts/tip.js',
  'lib/charts/percentage.js',
  'lib/charts/hover_line.js',
  'lib/charts/path_label.js',
  'lib/charts/cover.js',
  'lib/charts/stream.js',
  'lib/components/stream.js'
];
