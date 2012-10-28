var getTree = function (table, idIndex, pidIndex) {
  var ids = _.pluck(table, idIndex);
  var pids = _.pluck(table, pidIndex);
  var rootIDs = _.difference(pids, ids);

  var roots = table.filter(function (row) {
    return _.indexOf(rootIDs, row[pidIndex]) !== -1;
  });

  roots.forEach(function (root) {
    root.childs = table.filter(function (row) {
      return row[pidIndex] === root[idIndex];
    });
  });
  return roots;
};