module("DataV");
test("Themes.get", function () {
    equal(DataV.Themes.get("inexsit"), undefined, "Should get undefined when key is inexsit");
    equal(typeof DataV.Themes.get("COLOR_ARGS"), "object", "COLOR_ARGS should be an object");
    equal(DataV.Themes.get("COLOR_ARGS") instanceof Array, true, "COLOR_ARGS should have two items");
});

test("Themes.set", function () {
    raises(function(){
       DataV.Themes.set();
    }, "Arguments format error. should be: (themsName, theme)");
    raises(function(){
       DataV.Themes.set("t", "");
    }, "second argument theme should be a json object");
    raises(function(){
       DataV.Themes.set("t", {});
    }, "theme.COLOR_ARGS needed");
    raises(function(){
       DataV.Themes.set("t", {COLOR_ARGS: ""});
    }, "theme.COLOR_ARGS should be an array");
    raises(function(){
       DataV.Themes.set("t", {COLOR_ARGS: [""]});
    }, "theme.COLOR_ARGS[0] should be an array");

    DataV.Themes.set("t", {COLOR_ARGS: [["#aaa", "#test"]]});
    DataV.changeTheme("t");
    equal(DataV.Themes.get("COLOR_ARGS")[0][1], "#test", "set color Theme OK");
});

test("defaultColorFunction", function () {
    ok(DataV.Themes.get("COLOR_ARGS") instanceof Array, "return color 2-d array");
});

test("changeTheme", function () {
    equal(DataV.changeTheme("default"), true, "Change theme ok");
    equal(DataV.Themes.current, "default", "Default theme is default");
    equal(DataV.changeTheme("inexsit"), false, "Change theme failed");
    equal(DataV.Themes.current, "default", "Should also be default");
    equal(DataV.changeTheme("theme1"), true, "Change theme ok");
    equal(DataV.Themes.current, "theme1", "Should be theme1");
    equal(DataV.changeTheme("fake"), false, "Change theme failed");
    equal(DataV.Themes.current, "theme1", "Should still be theme1");
});

test("getColor", function () {
    equal(typeof DataV.getColor(), "object", "get color function");
    equal(DataV.Themes.get("COLOR_ARGS") instanceof Array, true, "COLOR_ARGS should have two items");
});

/*
test("recover default color theme", function () {
    DataV.changeTheme("default");
    //equal(DataV.Themes.current, "default", "Should also be datav");
});
*/

/*
asyncTest("hierarchyCsv and hierarchyTableToJson", function () {
    var jsonTest;
    var jsonDefault="{\"name\":\"flare\",\"children\":[{\"name\":\"analytics\",\"children\":[{\"name\":\"cluster\",\"children\":[{\"name\":\"AgglomerativeCluster\",\"size\":\"3938\"},{\"name\":\"CommunityStructure\",\"size\":\"3812\"},{\"name\":\"HierarchicalCluster\",\"size\":\"6714\"},{\"name\":\"MergeEdge\",\"size\":\"743\"}]},{\"name\":\"optimization\",\"children\":[{\"name\":\"AspectRatioBanker\",\"size\":\"7074\"}]}]},{\"name\":\"graph\",\"children\":[{\"name\":\"BetweennessCentrality\",\"size\":\"3534\"},{\"name\":\"LinkDistance\",\"size\":\"5731\"},{\"name\":\"MaxFlowMinCut\",\"size\":\"7840\"},{\"name\":\"shortestPaths\",\"size\":\"5914\"},{\"name\":\"SpanningTree\",\"size\":\"3416\"}]}]}";
    DataV.hierarchyCsv("../examples/treemap/hierarchy.csv",function(json){
            jsonTest = json;
    });
    setTimeout(function() {
        equal(JSON.stringify(jsonTest), jsonDefault,"hierarchyCsv return the right json, and hierarchyTableToJson works fine.");
        start();
    }, 1000);
});
*/

/*
test("hierarchyTableToJson", function(){
    var arr1 = [ ["ID","name","size","parentID"], ["1","ok","1",""] ];
    var arr2 = [ ["1","ok","1",""] ];
    var arr3 = [ ["1","ok","",""] ];
});
*/
test("Chart", function () {
    var chart = new DataV.Chart();
    equal(chart.getType(), "Chart", "should be Chart");
});

test("extend", function () {
    var Person = function (name) {
        this.age = 24;
        this.name = name;
    };
    Person.prototype.getName = function () {
        return this.name;
    };
    var Jackson = DataV.extend(Person, {
        initialize: function (name) {
            this.nickname = "nick " + name;
        },
        getAge: function () {
            return this.age;
        }
    });

    var jackson = new Jackson("jackson");

    equal(jackson.getAge(), 24, "should be 24");
    equal(jackson.getName(), "jackson", "should be jackson");
    equal(jackson.nickname, "nick jackson", "should be nick jackson");
    equal(jackson instanceof Jackson, true, "should be Jackson instance");
    equal(jackson instanceof Person, true, "should be Person instance");
});
