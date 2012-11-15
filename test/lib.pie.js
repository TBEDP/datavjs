module("Pie");

var pie = new Pie(document.createElement("div"));

test("map with index", function () {
  var map = pie.map({label: 0, value: 1});
  equal(map.label, 0, "label index should be 0");
  equal(map.value, 1, "value index should be 1");
  equal(map.hasField, false, "without field");
});

test("map with field", function () {
  var map = pie.map({label: 'label', value: 'value'});
  equal(map.label, "label", "label index should be 0");
  equal(map.value, "value", "value index should be 1");
  equal(map.hasField, true, "with field");
});
