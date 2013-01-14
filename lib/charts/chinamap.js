/*global d3, define, Raphael, _ */
/*!
 * Chinamap兼容定义部分
 */
;(function (name, definition) {
  if (typeof define === 'function') { // Module
    define(definition);
  } else { // Assign to common namespaces or simply the global object (window)
    this[name] = definition(function (id) { return this[id];});
  }
})('Chinamap', function (require) {
  var DataV = require('DataV');

  /**
   * Chinamap构造函数，继承自Chart
   * Options:
   *
   * - `width` 数字，图宽度，默认为600，表示图高600px
   * - `height` 数字，图高度，默认为500
   * - `geoDataPath` 字符串，地图数据的文件路径，如"../../lib/charts/data/chinaMap/"
   * - `mapId` 字符串，地图区域的Id,用于载入相应的地图文件。全国时，mapId为"0";新疆为"65"。其他各省Id可参考this.geoData.areaIdIndex。可调用getMapId()来获取某地区的mapId。
   * - `showWords` 布尔值，是否显示省名或市名的文字。默认为true,显示。
   * - `levelChangeable` 布尔值，是否开启全国与省之间的缩放。默认为true,开启。
   * - `zoomAnimate` 布尔值，缩放时是否显示动画。默认为true, 开启（因性能原因，IE6-8始终不开启）。
   * - `colorModel` 字符串，表示取色模式，可取"discrete"（默认）或"gradient"。"discrete"时颜色在colors中从头至尾循环选取，"gradient"时依照colors中颜色的渐变插值计算。
   * - `colors` 颜色字符串数组。默认为discrete模式下的离散颜色数组。
   * - `defaultAreacolor` 颜色字符串。默认为"#dddddd"。当区域没有数据时默认显示的颜色。
   * - `wordStyle` object。默认为{}。省名或城市名的文字的Raphael样式。具体设置方式请参考Raphael手册：http://raphaeljs.com/reference.html#Element.attr
   * - `areaStyle` object。默认为{}。省或城市的区域的Raphael样式。具体设置方式请参考Raphael手册：http://raphaeljs.com/reference.html#Element.attr
   *
   * Events:
   * - `areaHoverIn` 函数，表示鼠标移上某个区域的事件响应，默认为空函数;
   * - `areaHoverOut` 函数，表示鼠标移出某个区域的事件响应，默认为空函数;
   * - `areaClick` 函数，表示点击某个区域的事件响应，默认为空函数;
   * - `wordHoverIn` 函数，表示鼠标移上某个地名文字时的事件响应;
   * - `wordHoverOut` 函数，表示鼠标移出某个地名文字时的事件响应;
   * - `wordClick` 函数，表示点击某个地名文字的事件响应，默认为空函数;
   *
   * Examples:
   * create chinamap in a dom node with id "chart", width is 500; height is 600px;
   * ```
   * var chinamap = new Chinamap("chart", {"width": 500, "height": 600});
   * ```
   * @param {Object} node The dom node or dom node Id
   * @param {Object} options JSON object for determin chinamap style
   */
  var Chinamap = DataV.extend(DataV.Chart, {
    initialize: function (node, options) {
      this.type = "Chinamap";
      this.node = this.checkContainer(node);

      // Properties
      /*
      this.floatTag;//浮框对象，这是个可操作的对象。
      */
      this.viewBox = [];
      this.mapCache = {};
      this.states = [];
      this.words = [];
      this.projection = function () {}; // d3 map prejection function
      this.getAreaPath = function () {}; // input geojson feature, return area path string
      this.colorGenerator = function () {}; // produce gradient or discrete color;
      this.sourceData = {};
      this.geoData = {};
      // 区域与编号的对应关系
      this.geoData.areaIdIndex = {
        '全国': 0,
        '新疆': 65,
        '西藏': 54,
        '内蒙古': 15,
        '青海': 63,
        '四川': 51,
        '黑龙江': 23,
        '甘肃': 62,
        '云南': 53,
        '广西': 45,
        '湖南': 43,
        '陕西': 61,
        '广东': 44,
        '吉林': 22,
        '河北': 13,
        '湖北': 42,
        '贵州': 52,
        '山东': 37,
        '江西': 36,
        '河南': 41,
        '辽宁': 21,
        '山西': 14,
        '安徽': 34,
        '福建': 35,
        '浙江': 33,
        '江苏': 32,
        '重庆': 50,
        '宁夏': 64,
        '海南': 46,
        '台湾': 71,
        '北京': 11,
        '天津': 12,
        '上海': 31,
        '香港': 81,
        '澳门': 82
      };
      // 各区域的矢量图矩形边界
      this.geoData.areaBoxes = {
        //x, y, width, height when projection scale is 4000
        0: [-1174.6445229087194, -1437.3577680805693, 3039.3970214233723, 2531.19589698184],
        65: [-1174.9404317915883, -1136.0130934711678, 1216.4169237052663, 939.4360818385251],
        54: [-1061.2905098655508, -273.40253896102865, 1182.4138890465167, 728.4762434212385],
        15: [81.92106433333947, -1404.5655158641246, 1337.913665139638, 1168.7030286278964],
        63: [-398.0407413665446, -404.86540158240564, 770.5429460357634, 553.4881569694239],
        51: [34.77351011413543, -24.727858097581816, 654.265749584143, 581.5837904142871],
        23: [1185.0861642873883, -1435.9087566254907, 680.9449423479143, 618.3772597960831],
        62: [-197.5222870378875, -631.2015222269291, 884.6861134736321, 734.2542202456989],
        53: [-4.030270169151834, 326.89754492870105, 561.4971786143803, 565.9079094851168],
        45: [444.4355364538484, 524.7911424174906, 490.6548359068431, 384.1667316158848],
        43: [716.7125751678784, 265.3988842488122, 346.1702652872375, 377.50144051998274],
        61: [508.5948583446903, -399.56997062473215, 321.038690321553, 559.1002147021181],
        44: [790.2032875493967, 572.9640361040085, 494.8279567104971, 388.7112686526252],
        22: [1287.5729431804648, -950.943295028444, 504.33243011403374, 354.162667814153],
        13: [940.0156020671719, -646.4007207319194, 325.33903805510784, 477.4542727272415],
        42: [683.8325394595918, 45.82949601748078, 468.66717545627034, 295.2142095820616],
        52: [392.5021834497175, 337.4483828727408, 375.50579966539516, 320.9420464446699],
        37: [1035.7855473594757, -382.19242168799906, 412.5747391303373, 313.152767793266],
        36: [1012.6841751377355, 236.50140310944056, 295.599802392515, 400.86430917822287],
        41: [785.5419798731749, -185.2911232263814, 362.6977821251186, 340.3902676066224],
        21: [1203.0641741691293, -757.0946871553339, 352.71788824534656, 357.71276541155214],
        14: [776.5185040689469, -493.6204506126494, 212.68572802329425, 448.08485211774945],
        34: [1054.014965660052, -80.43770626104327, 295.73127466484925, 352.03731065611606],
        35: [1172.0955040211252, 341.81292779438445, 288.99462739279807, 339.42845011348845],
        33: [1272.1789620983063, 123.46272678646208, 286.17816622252326, 286.73860446060394],
        32: [1125.161343490302, -134.97368204682834, 356.1806346879009, 291.4961628010442],
        50: [497.78832088614774, 127.0051229616378, 291.91221530072164, 280.8880182020781],
        64: [441.193675072408, -376.31946967355213, 183.76989823787306, 293.0024551112753],
        46: [723.8031601361929, 946.050886515855, 183.33374783084207, 147.66048518654895],
        71: [1459.925544038912, 519.7445429876257, 103.06085087505835, 237.80851484008463],
        11: [1031.6052083127613, -530.1928574952913, 103.23943439987329, 114.66079087790081],
        12: [1106.9649995752443, -479.16508616378724, 71.21176554916747, 120.01987096046025],
        31: [1420.334836525578, 71.79837578328207, 70.41721601016525, 81.99461244072737],
        81: [1061.983645387268, 769.0837862603122, 50.65584483626753, 32.17422147262721],
        82: [1043.1350056914507, 798.0786255550063, 5.387452843479423, 7.564113979470676]
      };
      // 省的索引，包含经纬度和全名信息
      this.geoData.provinceIndex = {
        '新疆': {'loc': [84.9023, 41.748], 'fullName': '新疆'},
        '西藏': {'loc': [88.7695, 31.6846], 'fullName': '西藏'},
        '内蒙': {'loc': [117.5977, 44.3408], 'fullName': '内蒙古'},
        '青海': {'loc': [96.2402, 35.4199], 'fullName': '青海'},
        '四川': {'loc': [102.9199, 30.1904], 'fullName': '四川'},
        '黑龙': {'loc': [128.1445, 48.5156], 'fullName': '黑龙江'},
        '甘肃': {'loc': [95.7129, 40.166], 'fullName': '甘肃'},
        '云南': {'loc': [101.8652, 25.1807], 'fullName': '云南'},
        '广西': {'loc': [108.2813, 23.6426], 'fullName': '广西'},
        '湖南': {'loc': [111.5332, 27.3779], 'fullName': '湖南'},
        '陕西': {'loc': [109.5996, 35.6396], 'fullName': '陕西'},
        '广东': {'loc': [113.4668, 22.8076], 'fullName': '广东'},
        '吉林': {'loc': [126.4746, 43.5938], 'fullName': '吉林'},
        '河北': {'loc': [115.4004, 37.9688], 'fullName': '河北'},
        '湖北': {'loc': [112.2363, 31.1572], 'fullName': '湖北'},
        '贵州': {'loc': [106.6113, 26.9385], 'fullName': '贵州'},
        '山东': {'loc': [118.7402, 36.4307], 'fullName': '山东'},
        '江西': {'loc': [116.0156, 27.29], 'fullName': '江西'},
        '河南': {'loc': [113.4668, 33.8818], 'fullName': '河南'},
        '辽宁': {'loc': [122.3438, 41.0889], 'fullName': '辽宁'},
        '山西': {'loc': [112.4121, 37.6611], 'fullName': '山西'},
        '安徽': {'loc': [117.2461, 32.0361], 'fullName': '安徽'},
        '福建': {'loc': [118.3008, 25.9277], 'fullName': '福建'},
        '浙江': {'loc': [120.498, 29.0918], 'fullName': '浙江'},
        '江苏': {'loc': [120.0586, 32.915], 'fullName': '江苏'},
        '重庆': {'loc': [107.7539, 30.1904], 'fullName': '重庆'},
        '宁夏': {'loc': [105.9961, 37.3096], 'fullName': '宁夏'},
        '海南': {'loc': [109.9512, 19.2041], 'fullName': '海南'},
        '台湾': {'loc': [121.0254, 23.5986], 'fullName': '台湾'},
        '北京': {'loc': [116.4551, 40.2539], 'fullName': '北京'},
        '天津': {'loc': [117.4219, 39.4189], 'fullName': '天津'},
        '上海': {'loc': [121.4648, 31.2891], 'fullName': '上海'},
        '香港': {'loc': [114.2578, 22.3242], 'fullName': '香港'},
        '澳门': {'loc': [113.5547, 22.1484], 'fullName': '澳门'}
      };
      this.geoData.cityIndex = {//市的索引，包含经纬度和全名信息
        '重庆': {'loc': [107.7539, 30.1904], 'fullName': '重庆市'},
        '北京': {'loc': [116.4551, 40.2539], 'fullName': '北京市'},
        '天津': {'loc': [117.4219, 39.4189], 'fullName': '天津市'},
        '上海': {'loc': [121.4648, 31.2891], 'fullName': '上海市'},
        '香港': {'loc': [114.2578, 22.3242], 'fullName': '香港'},
        '澳门': {'loc': [113.5547, 22.1484], 'fullName': '澳门'},
        '巴音': {'loc': [88.1653, 39.6002], 'fullName': '巴音郭楞蒙古自治州'},
        '和田': {'loc': [81.167, 36.9855], 'fullName': '和田地区'},
        '哈密': {'loc': [93.7793, 42.9236], 'fullName': '哈密地区'},
        '阿克': {'loc': [82.9797, 41.0229], 'fullName': '阿克苏地区'},
        '阿勒': {'loc': [88.2971, 47.0929], 'fullName': '阿勒泰地区'},
        '喀什': {'loc': [77.168, 37.8534], 'fullName': '喀什地区'},
        '塔城': {'loc': [86.6272, 45.8514], 'fullName': '塔城地区'},
        '昌吉': {'loc': [89.6814, 44.4507], 'fullName': '昌吉回族自治州'},
        '克孜': {'loc': [74.6301, 39.5233], 'fullName': '克孜勒苏柯尔克孜自治州'},
        '吐鲁': {'loc': [89.6375, 42.4127], 'fullName': '吐鲁番地区'},
        '伊犁': {'loc': [82.5513, 43.5498], 'fullName': '伊犁哈萨克自治州'},
        '博尔': {'loc': [81.8481, 44.6979], 'fullName': '博尔塔拉蒙古自治州'},
        '乌鲁': {'loc': [87.9236, 43.5883], 'fullName': '乌鲁木齐市'},
        '克拉': {'loc': [85.2869, 45.5054], 'fullName': '克拉玛依市'},
        '阿拉尔': {'loc': [81.2769, 40.6549], 'fullName': '阿拉尔市'},
        '图木': {'loc': [79.1345, 39.8749], 'fullName': '图木舒克市'},
        '五家': {'loc': [87.5391, 44.3024], 'fullName': '五家渠市'},
        '石河': {'loc': [86.0229, 44.2914], 'fullName': '石河子市'},
        '那曲': {'loc': [88.1982, 33.3215], 'fullName': '那曲地区'},
        '阿里': {'loc': [82.3645, 32.7667], 'fullName': '阿里地区'},
        '日喀': {'loc': [86.2427, 29.5093], 'fullName': '日喀则地区'},
        '林芝': {'loc': [95.4602, 29.1138], 'fullName': '林芝地区'},
        '昌都': {'loc': [97.0203, 30.7068], 'fullName': '昌都地区'},
        '山南': {'loc': [92.2083, 28.3392], 'fullName': '山南地区'},
        '拉萨': {'loc': [91.1865, 30.1465], 'fullName': '拉萨市'},
        '呼伦': {'loc': [120.8057, 50.2185], 'fullName': '呼伦贝尔市'},
        '阿拉善': {'loc': [102.019, 40.1001], 'fullName': '阿拉善盟'},
        '锡林': {'loc': [115.6421, 44.176], 'fullName': '锡林郭勒盟'},
        '鄂尔': {'loc': [108.9734, 39.2487], 'fullName': '鄂尔多斯市'},
        '赤峰': {'loc': [118.6743, 43.2642], 'fullName': '赤峰市'},
        '巴彦': {'loc': [107.5562, 41.3196], 'fullName': '巴彦淖尔市'},
        '通辽': {'loc': [121.4758, 43.9673], 'fullName': '通辽市'},
        '乌兰': {'loc': [112.5769, 41.77], 'fullName': '乌兰察布市'},
        '兴安': {'loc': [121.3879, 46.1426], 'fullName': '兴安盟'},
        '包头': {'loc': [110.3467, 41.4899], 'fullName': '包头市'},
        '呼和': {'loc': [111.4124, 40.4901], 'fullName': '呼和浩特市'},
        '乌海': {'loc': [106.886, 39.4739], 'fullName': '乌海市'},
        '海西': {'loc': [94.9768, 37.1118], 'fullName': '海西蒙古族藏族自治州'},
        '玉树': {'loc': [93.5925, 33.9368], 'fullName': '玉树藏族自治州'},
        '果洛': {'loc': [99.3823, 34.0466], 'fullName': '果洛藏族自治州'},
        '海南': {'loc': [100.3711, 35.9418], 'fullName': '海南藏族自治州'},
        '海北': {'loc': [100.3711, 37.9138], 'fullName': '海北藏族自治州'},
        '黄南': {'loc': [101.5686, 35.1178], 'fullName': '黄南藏族自治州'},
        '海东': {'loc': [102.3706, 36.2988], 'fullName': '海东地区'},
        '西宁': {'loc': [101.4038, 36.8207], 'fullName': '西宁市'},
        '甘孜': {'loc': [99.9207, 31.0803], 'fullName': '甘孜藏族自治州'},
        '阿坝': {'loc': [102.4805, 32.4536], 'fullName': '阿坝藏族羌族自治州'},
        '凉山': {'loc': [101.9641, 27.6746], 'fullName': '凉山彝族自治州'},
        '绵阳': {'loc': [104.7327, 31.8713], 'fullName': '绵阳市'},
        '达州': {'loc': [107.6111, 31.333], 'fullName': '达州市'},
        '广元': {'loc': [105.6885, 32.2284], 'fullName': '广元市'},
        '雅安': {'loc': [102.6672, 29.8938], 'fullName': '雅安市'},
        '宜宾': {'loc': [104.6558, 28.548], 'fullName': '宜宾市'},
        '乐山': {'loc': [103.5791, 29.1742], 'fullName': '乐山市'},
        '南充': {'loc': [106.2048, 31.1517], 'fullName': '南充市'},
        '巴中': {'loc': [107.0618, 31.9977], 'fullName': '巴中市'},
        '泸州': {'loc': [105.4578, 28.493], 'fullName': '泸州市'},
        '成都': {'loc': [103.9526, 30.7617], 'fullName': '成都市'},
        '资阳': {'loc': [104.9744, 30.1575], 'fullName': '资阳市'},
        '攀枝': {'loc': [101.6895, 26.7133], 'fullName': '攀枝花市'},
        '眉山': {'loc': [103.8098, 30.0146], 'fullName': '眉山市'},
        '广安': {'loc': [106.6333, 30.4376], 'fullName': '广安市'},
        '德阳': {'loc': [104.48, 31.1133], 'fullName': '德阳市'},
        '内江': {'loc': [104.8535, 29.6136], 'fullName': '内江市'},
        '遂宁': {'loc': [105.5347, 30.6683], 'fullName': '遂宁市'},
        '自贡': {'loc': [104.6667, 29.2786], 'fullName': '自贡市'},
        '黑河': {'loc': [127.1448, 49.2957], 'fullName': '黑河市'},
        '大兴': {'loc': [124.1016, 52.2345], 'fullName': '大兴安岭地区'},
        '哈尔': {'loc': [127.9688, 45.368], 'fullName': '哈尔滨市'},
        '齐齐': {'loc': [124.541, 47.5818], 'fullName': '齐齐哈尔市'},
        '牡丹': {'loc': [129.7815, 44.7089], 'fullName': '牡丹江市'},
        '绥化': {'loc': [126.7163, 46.8018], 'fullName': '绥化市'},
        '伊春': {'loc': [129.1992, 47.9608], 'fullName': '伊春市'},
        '佳木': {'loc': [133.0005, 47.5763], 'fullName': '佳木斯市'},
        '鸡西': {'loc': [132.7917, 45.7361], 'fullName': '鸡西市'},
        '双鸭': {'loc': [133.5938, 46.7523], 'fullName': '双鸭山市'},
        '大庆': {'loc': [124.7717, 46.4282], 'fullName': '大庆市'},
        '鹤岗': {'loc': [130.4407, 47.7081], 'fullName': '鹤岗市'},
        '七台': {'loc': [131.2756, 45.9558], 'fullName': '七台河市'},
        '酒泉': {'loc': [96.2622, 40.4517], 'fullName': '酒泉市'},
        '张掖': {'loc': [99.7998, 38.7433], 'fullName': '张掖市'},
        '甘南': {'loc': [102.9199, 34.6893], 'fullName': '甘南藏族自治州'},
        '武威': {'loc': [103.0188, 38.1061], 'fullName': '武威市'},
        '陇南': {'loc': [105.304, 33.5632], 'fullName': '陇南市'},
        '庆阳': {'loc': [107.5342, 36.2], 'fullName': '庆阳市'},
        '白银': {'loc': [104.8645, 36.5076], 'fullName': '白银市'},
        '定西': {'loc': [104.5569, 35.0848], 'fullName': '定西市'},
        '天水': {'loc': [105.6445, 34.6289], 'fullName': '天水市'},
        '兰州': {'loc': [103.5901, 36.3043], 'fullName': '兰州市'},
        '平凉': {'loc': [107.0728, 35.321], 'fullName': '平凉市'},
        '临夏': {'loc': [103.2715, 35.5737], 'fullName': '临夏回族自治州'},
        '金昌': {'loc': [102.074, 38.5126], 'fullName': '金昌市'},
        '嘉峪': {'loc': [98.1738, 39.8035], 'fullName': '嘉峪关市'},
        '普洱': {'loc': [100.7446, 23.4229], 'fullName': '普洱市'},
        '红河': {'loc': [103.0408, 23.6041], 'fullName': '红河哈尼族彝族自治州'},
        '文山': {'loc': [104.8865, 23.5712], 'fullName': '文山壮族苗族自治州'},
        '曲靖': {'loc': [103.9417, 25.7025], 'fullName': '曲靖市'},
        '楚雄': {'loc': [101.6016, 25.3619], 'fullName': '楚雄彝族自治州'},
        '大理': {'loc': [99.9536, 25.6805], 'fullName': '大理白族自治州'},
        '临沧': {'loc': [99.613, 24.0546], 'fullName': '临沧市'},
        '迪庆': {'loc': [99.4592, 27.9327], 'fullName': '迪庆藏族自治州'},
        '昭通': {'loc': [104.0955, 27.6031], 'fullName': '昭通市'},
        '昆明': {'loc': [102.9199, 25.4663], 'fullName': '昆明市'},
        '丽江': {'loc': [100.448, 26.955], 'fullName': '丽江市'},
        '西双': {'loc': [100.8984, 21.8628], 'fullName': '西双版纳傣族自治州'},
        '保山': {'loc': [99.0637, 24.9884], 'fullName': '保山市'},
        '玉溪': {'loc': [101.9312, 23.8898], 'fullName': '玉溪市'},
        '怒江': {'loc': [99.1516, 26.5594], 'fullName': '怒江傈僳族自治州'},
        '德宏': {'loc': [98.1299, 24.5874], 'fullName': '德宏傣族景颇族自治州'},
        '百色': {'loc': [106.6003, 23.9227], 'fullName': '百色市'},
        '河池': {'loc': [107.8638, 24.5819], 'fullName': '河池市'},
        '桂林': {'loc': [110.5554, 25.318], 'fullName': '桂林市'},
        '南宁': {'loc': [108.479, 23.1152], 'fullName': '南宁市'},
        '柳州': {'loc': [109.3799, 24.9774], 'fullName': '柳州市'},
        '崇左': {'loc': [107.3364, 22.4725], 'fullName': '崇左市'},
        '来宾': {'loc': [109.7095, 23.8403], 'fullName': '来宾市'},
        '玉林': {'loc': [110.2148, 22.3792], 'fullName': '玉林市'},
        '梧州': {'loc': [110.9949, 23.5052], 'fullName': '梧州市'},
        '贺州': {'loc': [111.3135, 24.4006], 'fullName': '贺州市'},
        '钦州': {'loc': [109.0283, 22.0935], 'fullName': '钦州市'},
        '贵港': {'loc': [109.9402, 23.3459], 'fullName': '贵港市'},
        '防城': {'loc': [108.0505, 21.9287], 'fullName': '防城港市'},
        '北海': {'loc': [109.314, 21.6211], 'fullName': '北海市'},
        '怀化': {'loc': [109.9512, 27.4438], 'fullName': '怀化市'},
        '永州': {'loc': [111.709, 25.752], 'fullName': '永州市'},
        '邵阳': {'loc': [110.9619, 26.8121], 'fullName': '邵阳市'},
        '郴州': {'loc': [113.2361, 25.8673], 'fullName': '郴州市'},
        '常德': {'loc': [111.4014, 29.2676], 'fullName': '常德市'},
        '湘西': {'loc': [109.7864, 28.6743], 'fullName': '湘西土家族苗族自治州'},
        '衡阳': {'loc': [112.4121, 26.7902], 'fullName': '衡阳市'},
        '岳阳': {'loc': [113.2361, 29.1357], 'fullName': '岳阳市'},
        '益阳': {'loc': [111.731, 28.3832], 'fullName': '益阳市'},
        '长沙': {'loc': [113.0823, 28.2568], 'fullName': '长沙市'},
        '株洲': {'loc': [113.5327, 27.0319], 'fullName': '株洲市'},
        '张家界': {'loc': [110.5115, 29.328], 'fullName': '张家界市'},
        '娄底': {'loc': [111.6431, 27.7185], 'fullName': '娄底市'},
        '湘潭': {'loc': [112.5439, 27.7075], 'fullName': '湘潭市'},
        '榆林': {'loc': [109.8743, 38.205], 'fullName': '榆林市'},
        '延安': {'loc': [109.1052, 36.4252], 'fullName': '延安市'},
        '汉中': {'loc': [106.886, 33.0139], 'fullName': '汉中市'},
        '安康': {'loc': [109.1162, 32.7722], 'fullName': '安康市'},
        '商洛': {'loc': [109.8083, 33.761], 'fullName': '商洛市'},
        '宝鸡': {'loc': [107.1826, 34.3433], 'fullName': '宝鸡市'},
        '渭南': {'loc': [109.7864, 35.0299], 'fullName': '渭南市'},
        '咸阳': {'loc': [108.4131, 34.8706], 'fullName': '咸阳市'},
        '西安': {'loc': [109.1162, 34.2004], 'fullName': '西安市'},
        '铜川': {'loc': [109.0393, 35.1947], 'fullName': '铜川市'},
        '清远': {'loc': [112.9175, 24.3292], 'fullName': '清远市'},
        '韶关': {'loc': [113.7964, 24.7028], 'fullName': '韶关市'},
        '湛江': {'loc': [110.3577, 20.9894], 'fullName': '湛江市'},
        '梅州': {'loc': [116.1255, 24.1534], 'fullName': '梅州市'},
        '河源': {'loc': [114.917, 23.9722], 'fullName': '河源市'},
        '肇庆': {'loc': [112.1265, 23.5822], 'fullName': '肇庆市'},
        '惠州': {'loc': [114.6204, 23.1647], 'fullName': '惠州市'},
        '茂名': {'loc': [111.0059, 22.0221], 'fullName': '茂名市'},
        '江门': {'loc': [112.6318, 22.1484], 'fullName': '江门市'},
        '阳江': {'loc': [111.8298, 22.0715], 'fullName': '阳江市'},
        '云浮': {'loc': [111.7859, 22.8516], 'fullName': '云浮市'},
        '广州': {'loc': [113.5107, 23.2196], 'fullName': '广州市'},
        '汕尾': {'loc': [115.5762, 23.0438], 'fullName': '汕尾市'},
        '揭阳': {'loc': [116.1255, 23.313], 'fullName': '揭阳市'},
        '珠海': {'loc': [113.7305, 22.1155], 'fullName': '珠海市'},
        '佛山': {'loc': [112.8955, 23.1097], 'fullName': '佛山市'},
        '潮州': {'loc': [116.7847, 23.8293], 'fullName': '潮州市'},
        '汕头': {'loc': [117.1692, 23.3405], 'fullName': '汕头市'},
        '深圳': {'loc': [114.5435, 22.5439], 'fullName': '深圳市'},
        '东莞': {'loc': [113.8953, 22.901], 'fullName': '东莞市'},
        '中山': {'loc': [113.4229, 22.478], 'fullName': '中山市'},
        '延边': {'loc': [129.397, 43.2587], 'fullName': '延边朝鲜族自治州'},
        '吉林': {'loc': [126.8372, 43.6047], 'fullName': '吉林市'},
        '白城': {'loc': [123.0029, 45.2637], 'fullName': '白城市'},
        '松原': {'loc': [124.0906, 44.7198], 'fullName': '松原市'},
        '长春': {'loc': [125.8154, 44.2584], 'fullName': '长春市'},
        '白山': {'loc': [127.2217, 42.0941], 'fullName': '白山市'},
        '通化': {'loc': [125.9583, 41.8579], 'fullName': '通化市'},
        '四平': {'loc': [124.541, 43.4894], 'fullName': '四平市'},
        '辽源': {'loc': [125.343, 42.7643], 'fullName': '辽源市'},
        '承德': {'loc': [117.5757, 41.4075], 'fullName': '承德市'},
        '张家口': {'loc': [115.1477, 40.8527], 'fullName': '张家口市'},
        '保定': {'loc': [115.0488, 39.0948], 'fullName': '保定市'},
        '唐山': {'loc': [118.4766, 39.6826], 'fullName': '唐山市'},
        '沧州': {'loc': [116.8286, 38.2104], 'fullName': '沧州市'},
        '石家': {'loc': [114.4995, 38.1006], 'fullName': '石家庄市'},
        '邢台': {'loc': [114.8071, 37.2821], 'fullName': '邢台市'},
        '邯郸': {'loc': [114.4775, 36.535], 'fullName': '邯郸市'},
        '秦皇': {'loc': [119.2126, 40.0232], 'fullName': '秦皇岛市'},
        '衡水': {'loc': [115.8838, 37.7161], 'fullName': '衡水市'},
        '廊坊': {'loc': [116.521, 39.0509], 'fullName': '廊坊市'},
        '恩施': {'loc': [109.5007, 30.2563], 'fullName': '恩施土家族苗族自治州'},
        '十堰': {'loc': [110.5115, 32.3877], 'fullName': '十堰市'},
        '宜昌': {'loc': [111.1707, 30.7617], 'fullName': '宜昌市'},
        '襄樊': {'loc': [111.9397, 31.9263], 'fullName': '襄樊市'},
        '黄冈': {'loc': [115.2686, 30.6628], 'fullName': '黄冈市'},
        '荆州': {'loc': [113.291, 30.0092], 'fullName': '荆州市'},
        '荆门': {'loc': [112.6758, 30.9979], 'fullName': '荆门市'},
        '咸宁': {'loc': [114.2578, 29.6631], 'fullName': '咸宁市'},
        '随州': {'loc': [113.4338, 31.8768], 'fullName': '随州市'},
        '孝感': {'loc': [113.9502, 31.1188], 'fullName': '孝感市'},
        '武汉': {'loc': [114.3896, 30.6628], 'fullName': '武汉市'},
        '黄石': {'loc': [115.0159, 29.9213], 'fullName': '黄石市'},
        '神农': {'loc': [110.4565, 31.5802], 'fullName': '神农架林区'},
        '天门': {'loc': [113.0273, 30.6409], 'fullName': '天门市'},
        '仙桃': {'loc': [113.3789, 30.3003], 'fullName': '仙桃市'},
        '潜江': {'loc': [112.7637, 30.3607], 'fullName': '潜江市'},
        '鄂州': {'loc': [114.7302, 30.4102], 'fullName': '鄂州市'},
        '遵义': {'loc': [106.908, 28.1744], 'fullName': '遵义市'},
        '黔东': {'loc': [108.4241, 26.4166], 'fullName': '黔东南苗族侗族自治州'},
        '毕节': {'loc': [105.1611, 27.0648], 'fullName': '毕节地区'},
        '黔南': {'loc': [107.2485, 25.8398], 'fullName': '黔南布依族苗族自治州'},
        '铜仁': {'loc': [108.6218, 28.0096], 'fullName': '铜仁地区'},
        '黔西': {'loc': [105.5347, 25.3949], 'fullName': '黔西南布依族苗族自治州'},
        '六盘': {'loc': [104.7546, 26.0925], 'fullName': '六盘水市'},
        '安顺': {'loc': [105.9082, 25.9882], 'fullName': '安顺市'},
        '贵阳': {'loc': [106.6992, 26.7682], 'fullName': '贵阳市'},
        '烟台': {'loc': [120.7397, 37.5128], 'fullName': '烟台市'},
        '临沂': {'loc': [118.3118, 35.2936], 'fullName': '临沂市'},
        '潍坊': {'loc': [119.0918, 36.524], 'fullName': '潍坊市'},
        '青岛': {'loc': [120.4651, 36.3373], 'fullName': '青岛市'},
        '菏泽': {'loc': [115.6201, 35.2057], 'fullName': '菏泽市'},
        '济宁': {'loc': [116.8286, 35.3375], 'fullName': '济宁市'},
        '德州': {'loc': [116.6858, 37.2107], 'fullName': '德州市'},
        '滨州': {'loc': [117.8174, 37.4963], 'fullName': '滨州市'},
        '聊城': {'loc': [115.9167, 36.4032], 'fullName': '聊城市'},
        '东营': {'loc': [118.7073, 37.5513], 'fullName': '东营市'},
        '济南': {'loc': [117.1582, 36.8701], 'fullName': '济南市'},
        '泰安': {'loc': [117.0264, 36.0516], 'fullName': '泰安市'},
        '威海': {'loc': [121.9482, 37.1393], 'fullName': '威海市'},
        '日照': {'loc': [119.2786, 35.5023], 'fullName': '日照市'},
        '淄博': {'loc': [118.0371, 36.6064], 'fullName': '淄博市'},
        '枣庄': {'loc': [117.323, 34.8926], 'fullName': '枣庄市'},
        '莱芜': {'loc': [117.6526, 36.2714], 'fullName': '莱芜市'},
        '赣州': {'loc': [115.2795, 25.8124], 'fullName': '赣州市'},
        '吉安': {'loc': [114.884, 26.9659], 'fullName': '吉安市'},
        '上饶': {'loc': [117.8613, 28.7292], 'fullName': '上饶市'},
        '九江': {'loc': [115.4224, 29.3774], 'fullName': '九江市'},
        '抚州': {'loc': [116.4441, 27.4933], 'fullName': '抚州市'},
        '宜春': {'loc': [115.0159, 28.3228], 'fullName': '宜春市'},
        '南昌': {'loc': [116.0046, 28.6633], 'fullName': '南昌市'},
        '景德': {'loc': [117.334, 29.3225], 'fullName': '景德镇市'},
        '萍乡': {'loc': [113.9282, 27.4823], 'fullName': '萍乡市'},
        '鹰潭': {'loc': [117.0813, 28.2349], 'fullName': '鹰潭市'},
        '新余': {'loc': [114.95, 27.8174], 'fullName': '新余市'},
        '南阳': {'loc': [112.4011, 33.0359], 'fullName': '南阳市'},
        '信阳': {'loc': [114.8291, 32.0197], 'fullName': '信阳市'},
        '洛阳': {'loc': [112.0605, 34.3158], 'fullName': '洛阳市'},
        '驻马': {'loc': [114.1589, 32.9041], 'fullName': '驻马店市'},
        '周口': {'loc': [114.873, 33.6951], 'fullName': '周口市'},
        '商丘': {'loc': [115.741, 34.2828], 'fullName': '商丘市'},
        '三门': {'loc': [110.8301, 34.3158], 'fullName': '三门峡市'},
        '新乡': {'loc': [114.2029, 35.3595], 'fullName': '新乡市'},
        '平顶': {'loc': [112.9724, 33.739], 'fullName': '平顶山市'},
        '郑州': {'loc': [113.4668, 34.6234], 'fullName': '郑州市'},
        '安阳': {'loc': [114.5325, 36.0022], 'fullName': '安阳市'},
        '开封': {'loc': [114.5764, 34.6124], 'fullName': '开封市'},
        '焦作': {'loc': [112.8406, 35.1508], 'fullName': '焦作市'},
        '许昌': {'loc': [113.6975, 34.0466], 'fullName': '许昌市'},
        '濮阳': {'loc': [115.1917, 35.799], 'fullName': '濮阳市'},
        '漯河': {'loc': [113.8733, 33.6951], 'fullName': '漯河市'},
        '鹤壁': {'loc': [114.3787, 35.744], 'fullName': '鹤壁市'},
        '大连': {'loc': [122.2229, 39.4409], 'fullName': '大连市'},
        '朝阳': {'loc': [120.0696, 41.4899], 'fullName': '朝阳市'},
        '丹东': {'loc': [124.541, 40.4242], 'fullName': '丹东市'},
        '铁岭': {'loc': [124.2773, 42.7423], 'fullName': '铁岭市'},
        '沈阳': {'loc': [123.1238, 42.1216], 'fullName': '沈阳市'},
        '抚顺': {'loc': [124.585, 41.8579], 'fullName': '抚顺市'},
        '葫芦': {'loc': [120.1575, 40.578], 'fullName': '葫芦岛市'},
        '阜新': {'loc': [122.0032, 42.2699], 'fullName': '阜新市'},
        '锦州': {'loc': [121.6626, 41.4294], 'fullName': '锦州市'},
        '鞍山': {'loc': [123.0798, 40.6055], 'fullName': '鞍山市'},
        '本溪': {'loc': [124.1455, 41.1987], 'fullName': '本溪市'},
        '营口': {'loc': [122.4316, 40.4297], 'fullName': '营口市'},
        '辽阳': {'loc': [123.4094, 41.1383], 'fullName': '辽阳市'},
        '盘锦': {'loc': [121.9482, 41.0449], 'fullName': '盘锦市'},
        '忻州': {'loc': [112.4561, 38.8971], 'fullName': '忻州市'},
        '吕梁': {'loc': [111.3574, 37.7325], 'fullName': '吕梁市'},
        '临汾': {'loc': [111.4783, 36.1615], 'fullName': '临汾市'},
        '晋中': {'loc': [112.7747, 37.37], 'fullName': '晋中市'},
        '运城': {'loc': [111.1487, 35.2002], 'fullName': '运城市'},
        '大同': {'loc': [113.7854, 39.8035], 'fullName': '大同市'},
        '长治': {'loc': [112.8625, 36.4746], 'fullName': '长治市'},
        '朔州': {'loc': [113.0713, 39.6991], 'fullName': '朔州市'},
        '晋城': {'loc': [112.7856, 35.6342], 'fullName': '晋城市'},
        '太原': {'loc': [112.3352, 37.9413], 'fullName': '太原市'},
        '阳泉': {'loc': [113.4778, 38.0951], 'fullName': '阳泉市'},
        '六安': {'loc': [116.3123, 31.8329], 'fullName': '六安市'},
        '安庆': {'loc': [116.7517, 30.5255], 'fullName': '安庆市'},
        '滁州': {'loc': [118.1909, 32.536], 'fullName': '滁州市'},
        '宣城': {'loc': [118.8062, 30.6244], 'fullName': '宣城市'},
        '阜阳': {'loc': [115.7629, 32.9919], 'fullName': '阜阳市'},
        '宿州': {'loc': [117.5208, 33.6841], 'fullName': '宿州市'},
        '黄山': {'loc': [118.0481, 29.9542], 'fullName': '黄山市'},
        '巢湖': {'loc': [117.7734, 31.4978], 'fullName': '巢湖市'},
        '亳州': {'loc': [116.1914, 33.4698], 'fullName': '亳州市'},
        '池州': {'loc': [117.3889, 30.2014], 'fullName': '池州市'},
        '合肥': {'loc': [117.29, 32.0581], 'fullName': '合肥市'},
        '蚌埠': {'loc': [117.4109, 33.1073], 'fullName': '蚌埠市'},
        '芜湖': {'loc': [118.3557, 31.0858], 'fullName': '芜湖市'},
        '淮北': {'loc': [116.6968, 33.6896], 'fullName': '淮北市'},
        '淮南': {'loc': [116.7847, 32.7722], 'fullName': '淮南市'},
        '马鞍': {'loc': [118.6304, 31.5363], 'fullName': '马鞍山市'},
        '铜陵': {'loc': [117.9382, 30.9375], 'fullName': '铜陵市'},
        '南平': {'loc': [118.136, 27.2845], 'fullName': '南平市'},
        '三明': {'loc': [117.5317, 26.3013], 'fullName': '三明市'},
        '龙岩': {'loc': [116.8066, 25.2026], 'fullName': '龙岩市'},
        '宁德': {'loc': [119.6521, 26.9824], 'fullName': '宁德市'},
        '福州': {'loc': [119.4543, 25.9222], 'fullName': '福州市'},
        '漳州': {'loc': [117.5757, 24.3732], 'fullName': '漳州市'},
        '泉州': {'loc': [118.3228, 25.1147], 'fullName': '泉州市'},
        '莆田': {'loc': [119.0918, 25.3455], 'fullName': '莆田市'},
        '厦门': {'loc': [118.1689, 24.6478], 'fullName': '厦门市'},
        '丽水': {'loc': [119.5642, 28.1854], 'fullName': '丽水市'},
        '杭州': {'loc': [119.5313, 29.8773], 'fullName': '杭州市'},
        '温州': {'loc': [120.498, 27.8119], 'fullName': '温州市'},
        '宁波': {'loc': [121.5967, 29.6466], 'fullName': '宁波市'},
        '舟山': {'loc': [122.2559, 30.2234], 'fullName': '舟山市'},
        '台州': {'loc': [121.1353, 28.6688], 'fullName': '台州市'},
        '金华': {'loc': [120.0037, 29.1028], 'fullName': '金华市'},
        '衢州': {'loc': [118.6853, 28.8666], 'fullName': '衢州市'},
        '绍兴': {'loc': [120.564, 29.7565], 'fullName': '绍兴市'},
        '嘉兴': {'loc': [120.9155, 30.6354], 'fullName': '嘉兴市'},
        '湖州': {'loc': [119.8608, 30.7782], 'fullName': '湖州市'},
        '盐城': {'loc': [120.2234, 33.5577], 'fullName': '盐城市'},
        '徐州': {'loc': [117.5208, 34.3268], 'fullName': '徐州市'},
        '南通': {'loc': [121.1023, 32.1625], 'fullName': '南通市'},
        '淮安': {'loc': [118.927, 33.4039], 'fullName': '淮安市'},
        '苏州': {'loc': [120.6519, 31.3989], 'fullName': '苏州市'},
        '宿迁': {'loc': [118.5535, 33.7775], 'fullName': '宿迁市'},
        '连云': {'loc': [119.1248, 34.552], 'fullName': '连云港市'},
        '扬州': {'loc': [119.4653, 32.8162], 'fullName': '扬州市'},
        '南京': {'loc': [118.8062, 31.9208], 'fullName': '南京市'},
        '泰州': {'loc': [120.0586, 32.5525], 'fullName': '泰州市'},
        '无锡': {'loc': [120.3442, 31.5527], 'fullName': '无锡市'},
        '常州': {'loc': [119.4543, 31.5582], 'fullName': '常州市'},
        '镇江': {'loc': [119.4763, 31.9702], 'fullName': '镇江市'},
        '吴忠': {'loc': [106.853, 37.3755], 'fullName': '吴忠市'},
        '中卫': {'loc': [105.4028, 36.9525], 'fullName': '中卫市'},
        '固原': {'loc': [106.1389, 35.9363], 'fullName': '固原市'},
        '银川': {'loc': [106.3586, 38.1775], 'fullName': '银川市'},
        '石嘴': {'loc': [106.4795, 39.0015], 'fullName': '石嘴山市'},
        '儋州': {'loc': [109.3291, 19.5653], 'fullName': '儋州市'},
        '文昌': {'loc': [110.8905, 19.7823], 'fullName': '文昌市'},
        '乐东': {'loc': [109.0283, 18.6301], 'fullName': '乐东黎族自治县'},
        '三亚': {'loc': [109.3716, 18.3698], 'fullName': '三亚市'},
        '琼中': {'loc': [109.8413, 19.0736], 'fullName': '琼中黎族苗族自治县'},
        '东方': {'loc': [108.8498, 19.0414], 'fullName': '东方市'},
        '海口': {'loc': [110.3893, 19.8516], 'fullName': '海口市'},
        '万宁': {'loc': [110.3137, 18.8388], 'fullName': '万宁市'},
        '澄迈': {'loc': [109.9937, 19.7314], 'fullName': '澄迈县'},
        '白沙': {'loc': [109.3703, 19.211], 'fullName': '白沙黎族自治县'},
        '琼海': {'loc': [110.4208, 19.224], 'fullName': '琼海市'},
        '昌江': {'loc': [109.0407, 19.2137], 'fullName': '昌江黎族自治县'},
        '临高': {'loc': [109.6957, 19.8063], 'fullName': '临高县'},
        '陵水': {'loc': [109.9924, 18.5415], 'fullName': '陵水黎族自治县'},
        '屯昌': {'loc': [110.0377, 19.362], 'fullName': '屯昌县'},
        '定安': {'loc': [110.3384, 19.4698], 'fullName': '定安县'},
        '保亭': {'loc': [109.6284, 18.6108], 'fullName': '保亭黎族苗族自治县'},
        '五指': {'loc': [109.5282, 18.8299], 'fullName': '五指山市'}
      };

      // Canvas
      this.defaults.geoDataPath = "";
      this.defaults.width = 600;
      this.defaults.height = 500;
      this.defaults.mapId = "0";
      this.defaults.showWords = true; // show words or not
      this.defaults.levelChangeable = true; // show words or not
      this.defaults.zoomAnimate = true; // show words or not
      this.defaults.colorModel = "discrete"; // discrete or gradient color
      this.defaults.colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
      this.defaults.defaultAreaColor = "#dddddd"; // if area with no data show this color
      this.defaults.wordStyle = {};
      this.defaults.areaStyle = {};

      this.renderCallback = function () {};

      this.setOptions(options);
      this.createCanvas();
    }
  });

  /**
   * get value from indexes
   */
  Chinamap.prototype._searchIndex = function (key, name, regionType) {
    var map = this;
    var result;
    var search = function (regionType, name) {
      var shortName = name.substr(0, 2);
      if (regionType === 'city') {
        //prevent duplicate，张家口市,张家界市，阿拉善盟, 阿拉尔市
        if (shortName === '阿拉' || shortName === '张家') {
          shortName = name.substr(0, 3);
        }
      }
      var hash = regionType === 'city' ? map.geoData.cityIndex : map.geoData.provinceIndex;
      var result = hash[shortName];
      return result && result[key] || undefined;
    };

    if (typeof regionType === 'undefined') {
      //province, then city
      if (name === '吉林市' || name === '海南藏族自治州') {
        //吉林省， 吉林市； 海南省，海南藏族自治州
        result = search("city", name);
      } else {
        result = search("province", name) || search("city", name);
      }
    } else {
      if (regionType === 'province') {
        //province
        result = search("province", name);
      } else if (regionType === 'city') {
        //city
        result = search("city", name);
      }
    }

    return result;
  };

  /**
   * get longitude and latitude center by city or porvince name
   * regionType is optional, if it's undefined, then first search province, then city
   */
  Chinamap.prototype.getLoc = function (name, regionType) {
    return this._searchIndex('loc', name, regionType);
  };

  /**
   * get longitude and latitude center by porvince name
   */
  Chinamap.prototype.getProvinceCenter = function (name) {
    return this.getLoc(name, 'province');
  };

  /**
   * get longitude and latitude center by city name
   */
  Chinamap.prototype.getCityCenter = function (name) {
    return this.getLoc(name, 'city');
  };

  /**
   * get format name by city or porvince name
   * regionType is optional, if it's undefined, then first search province, then city
   */
  Chinamap.prototype.getFormatName = function (name, regionType) {
    return this._searchIndex('fullName', name, regionType);
  };

  /**
   * get fullName by porvince name
   */
  Chinamap.prototype.getProvinceFormatName = function (name) {
    return this.getFormatName(name, 'province');
  };

  /**
   * get fullName by city name
   */
  Chinamap.prototype.getCityFormatName = function (name) {
    return this.getFormatName(name, 'city');
  };

  /**
   * Create dom node relate to chinamap
   */
  Chinamap.prototype.createCanvas = function () {
    var conf = this.defaults,
      canvasStyle,
      container = this.node;

    this.canvas = document.createElement("div");
    canvasStyle = this.canvas.style;
    canvasStyle.position = "relative";
    canvasStyle.width = conf.width + "px";
    canvasStyle.height = conf.height + "px";
    container.appendChild(this.canvas);

    this.paper = new Raphael(this.canvas, conf.width, conf.height);

    this.floatTag = DataV.FloatTag()(this.canvas);
    this.floatTag.css({"visibility": "hidden"});
  };

  /**
   * get mapId by area name
   */
  Chinamap.prototype.getMapId = function (areaName) {
    return this.geoData.areaIdIndex[areaName.substr(0, 2)];
  };

  /**
   * 获取区域颜色。内部函数。用户设置colorModel和colors来设置区域颜色。输入为地图区域对象，内部对象，包含某个地图区域的信息。
   * 内部的实现流程是：如果颜色生成函数不存在，则根据colorModel生成颜色生成函数。"discrete"时颜色在colors中从头至尾循环选取，"gradient"时依照colors中颜色的渐变插值计算。离散色时颜色有区域的分类决定。渐变色时颜色由区域的值决定（最小值和最大值间进行插值）。
   */
  Chinamap.prototype.getColor = function (d) {
    var colors = this.defaults.colors;
    var value;
    if (typeof this.colorGenerator.range === 'undefined') {
      if (this.defaults.colorModel === 'discrete') {
        this.colorGenerator = d3.scale.ordinal().range(colors);
      } else {
        this.colorGenerator = d3.scale.linear()
          .range(colors.length === 1 ? colors.concat(colors) : colors)
          .domain(d3.range(0, 1, 1 / (colors.length - 1)).concat([1])); 
      }
      this.colorGenerator.min = d3.min(d3.values(this.sourceData));
      this.colorGenerator.domainBand = d3.max(d3.values(this.sourceData)) - this.colorGenerator.min;
    }
    value = this.sourceData[d.properties.name];
    if (typeof value === 'undefined') {
      //no data area color
      return this.defaults.defaultAreaColor;
    } else {
      if (this.defaults.colorModel === 'discrete') {
        return this.colorGenerator(value);
      } else {
        var val = this.colorGenerator.domainBand === 0 ? 1
          : (value - this.colorGenerator.min) / this.colorGenerator.domainBand;
        return this.colorGenerator(val);
      }
    }
  };

  /**
   * 设置数据源
   * Examples:
   * 输入为object。key为地区名称。当区域分成多个类时，value为类别名。当区域有值时，value为数字。
   * ```
   *  //示例一，区域有值，全国各省人口数据，适合用渐变色显示。
   *  chinamap.setSource({
   *    '北京': 19612368,
   *    '天津': 12938224,
   *    '河北': 71854202,
   *    '山西': 35712111,
   *    '内蒙': 24706321,
   *    '辽宁': 43746323,
   *    '吉林': 27462297,
   *    '黑龙': 38312224,
   *    '上海': 23019148,
   *    '江苏': 78659903,
   *    '浙江': 54426891,
   *    '安徽': 59500510,
   *    '福建': 36894216,
   *    '江西': 44567475,
   *    '山东': 95793065,
   *    '河南': 94023567,
   *    '湖北': 57237740,
   *    '湖南': 65683722,
   *    '广东': 104303132,
   *    '广西': 46026629,
   *    '海南': 8671518,
   *    '重庆': 28846170,
   *    '四川': 80418200,
   *    '贵州': 34746468,
   *    '云南': 45966239,
   *    '西藏': 3002166,
   *    '陕西': 37327378,
   *    '甘肃': 25575254,
   *    '青海': 5626722,
   *    '宁夏': 6301350,
   *    '新疆': 21813334,
   *    '香港': 7097600,
   *    '澳门': 552300,
   *    '台湾': 23162123
   *  });
   *  //示例二，区域分成各个类，适合用渐变色显示。
   *  chinamap.setSource({
   *    '北京': '华北',
   *    '天津': '华北',
   *    '河北': '华北',
   *    '山西': '华北',
   *    '内蒙古': '华北',
   *    '上海': '华东',
   *    '江苏': '华东',
   *    '浙江': '华东',
   *    '山东': '华东',
   *    '安徽': '华东',
   *    '辽宁': '东北',
   *    '吉林': '东北',
   *    '黑龙江': '东北',
   *    '湖北': '华中',
   *    '湖南': '华中',
   *    '河南': '华中',
   *    '江西': '华中',
   *    '广东': '华南',
   *    '广西': '华南',
   *    '海南': '华南',
   *    '福建': '华南',
   *    '四川': '西南',
   *    '重庆': '西南',
   *    '贵州': '西南',
   *    '云南': '西南',
   *    '西藏': '西南',
   *    '陕西': '西北',
   *    '甘肃': '西北',
   *    '新疆': '西北',
   *    '青海': '西北',
   *    '宁夏': '西北',
   *    '香港': '港澳台',
   *    '澳门': '港澳台',
   *    '台湾 ': '港澳台'
   *  });
   * ```
   * @param {Object} area json
   */
  Chinamap.prototype.setSource = function (source) {
    var key, formatName;
    for (key in source) {
      formatName = this.getFormatName(key);
      if (typeof formatName !== 'undefined') {
        this.sourceData[formatName] = source[key];
      }
    }
  };

  /*!
   * d3 chinamap layout
   */
  Chinamap.prototype.layout = function () {
    this.projection = d3.geo.albers()
      .origin([105, 30.5])
      .scale(4000);

    this.getAreaPath = d3.geo.path()
      .projection(this.projection);
  };

  /**
   * 根据省份名字，获取省份的对象
   */
  Chinamap.prototype.getAreaByName = function (name) {
    var cache = this.mapCache[this.areaId];
    var index = _.indexOf(cache.names, name);
    return cache.states[index];
  };

  /*!
   * 生成绘制路径
   */
  Chinamap.prototype.generatePaths = function () {
    var conf = this.defaults;
    var map = this;
    var states = map.states;
    var words = map.words;
    var projection = map.projection;
    var getAreaPath = map.getAreaPath;
    var mapCache = map.mapCache;
    var paper = this.paper;
    var cache;
    var areaBoxes = this.geoData.areaBoxes;

    var render = function (areaId, json) {
      map.areaId = areaId;
      var getCallback = function (d) {
        return function () {
          parseInt(areaId, 10) === 0 ?
          (function () {
            var specialArea = {
              "香港": 1,
              "澳门": 1,
              "台湾": 1,
              "北京": 1,
              "重庆": 1,
              "上海": 1,
              "天津": 1
            };
            if (d.properties.name in specialArea) {
              //香港，澳门，台湾，北京，重庆，上海，天津不能下探。
              return;
            }
            if (typeof mapCache[d.id] === 'undefined') {
              d3.json(conf.geoDataPath + d.id + ".json", function (j) {
                render(d.id, j);
              });
            } else {
              render(d.id);
            }
          }())
          : (function () {
            if (typeof map.mapCache[0] === 'undefined') {
              d3.json(conf.geoDataPath + "0.json", function (j) {
                render(0, j);
              });
            } else {
              render(0);
            }
          }());
        };
      };
      var getCenterX = function (d) {
        return projection(d.properties.cp)[0];
      };
      var getCenterY = function (d) {
        return projection(d.properties.cp)[1];
      };
      var getText = function (d) {
        return d.properties.name;
      };

      //paper.clear();
      states.forEach(function (d) {
        d.hide();
      });
      words.forEach(function (d) {
        d.hide();
      });

      states = map.states = [];
      words = map.words = [];
    
      if (typeof mapCache[areaId] === 'undefined') {//no cache
        cache = mapCache[areaId] = {
          states: [],
          words: [],
          names: []
        };
    
        //state
        json.features.forEach(function (d) {
          var state = paper.path(getAreaPath(d));
          d.fillColor = map.getColor(d);
          state.attr({
            "fill": d.fillColor,
            "stroke": "#fff"
          })
          .data("info", d)
          .click(function (event) {
            if (conf.levelChangeable) {
              getCallback(d);
            }
            map.fire("areaClick", this, event);
          }).mouseover(function (event) {
            map.fire("areaHoverIn", this, event);
          }).mouseout(function (event) {
            map.fire("areaHoverOut", this, event);
          });
          states.push(state);
          state.node.debugName = d.id;
          cache.states.push(state);
          cache.names.push(d.properties.name);
        });

        // word
        json.features.forEach(function (d) {
          var areaName = getText(d);
          var word = paper.text(getCenterX(d), getCenterY(d), areaName);
          //香港，澳门文字偏移，防止挤在一处
          if (areaName === "澳门") {
            word.attr({"text-anchor": "end"});
          } else if (areaName === "香港") {
            word.attr({"text-anchor": "start"});
          }
          word.attr({
            "font-family": '"微软雅黑", "宋体"'
          })
          .data("info", d)
          .click(function () {
            if (conf.levelChangeable) {
              getCallback(d);
            }
            map.fire("wordClick", this);
          }).mouseover(function (event) {
            map.fire("wordHoverIn", this, event);
          }).mouseout(function (event) {
            map.fire("wordHoverOut", this, event);
          });
          if (!conf.showWords) {
            word.hide();
          }
          if (conf.levelChangeable) {
            word.click(getCallback(d));
          }
          words.push(word);
          cache.words.push(word);
        });

        states.forEach(function (d, i) {
          d.data("word", words[i]).data("map", map);
          words[i].data("state", d).data("map", map);
        });
      } else {
      // cached 
        //state
        states = mapCache[areaId].states;
        states.forEach(function (d) {
          d.show();
        });
      
        //word
        words = mapCache[areaId].words;
        if (conf.showWords) {
          words.forEach(function (d) {
            d.show();
          });
        }
      }
    
      var getStatesBox = function () {
        var box = {};
        var areabox = areaBoxes[areaId];
        box.x = areabox[0];
        box.y = areabox[1];
        box.width = areabox[2];
        box.height = areabox[3];
        box.x2 = areabox[2] + areabox[0];
        box.y2 = areabox[3] + areabox[1];
        return box;
      };

      (function trans () {
        var recentViewBox = map.viewBox.slice();
        var statesBox = getStatesBox();
        var newBox = [statesBox.x, statesBox.y, statesBox.width, statesBox.height];
        var scale = Math.max(statesBox.width / conf.width, statesBox.height / conf.height); // the ratio that keep the font be the same size no matter what view box size is.

        var viewBoxAnim = function (oldBox, newBox, time) {
          var ti = 30;
          var flag = true;
          var start = +new Date();
          var getBox = function (ratio) {
            var box = [];
            var i, l;
            if (ratio >= 1) {
              return newBox;
            }
            for (i = 0, l = oldBox.length; i < l; i++) {
              box[i] = (newBox[i] - oldBox[i]) * ratio + oldBox[i];
            }
            return box;
          };
          var getRatio = function () {
            var t = +new Date();
            var ratio = (t - start) / time;
            if (ratio > 1) {
              ratio = 1;
            }
            var easing = function (n) {
              return Math.pow(n, 1.7);
            };
            return easing(ratio);
          };
          var anim = function () {
            if (flag === false) {
              return;
            }
            //not permit new flame
            flag = false;
            //set new flame;
            var ratio = getRatio();
            var box = getBox(ratio);
            //draw
            paper.setViewBox(box[0], box[1], box[2], box[3], true);
            if (ratio >= 1) {
              clearInterval(interval);
            }
            flag = true;
          };
          var interval = setInterval(anim, ti);
        };
    
        states.forEach(function (d, i) {
          states[i].attr({
            "stroke-width": 1 //2 * scale
          })
          .attr(conf.areaStyle);
          words[i].attr({
            "font-size": Math.round(Math.max(14 * scale, 1))//14 * scale + "px"
          })
          .attr(conf.wordStyle);
        });

        if (recentViewBox.length === 0) { // first render 
          paper.setViewBox(newBox[0], newBox[1], newBox[2], newBox[3], true);
        } else {
          if (conf.zoomAnimate === false || Raphael.vml) {
            paper.setViewBox(newBox[0], newBox[1], newBox[2], newBox[3], true);
          } else {
            viewBoxAnim(recentViewBox, newBox, 300);
          }
        }

        map.viewBox = newBox;
        map.viewBoxShift = (function (x, y, w, h, fit) {
          var width = conf.width,
            height = conf.height,
            size = 1 / Math.max(w / width, h / height),
            H, W;
          if (fit) {
            H = height / h;
            W = width / w;
            if (w * H < width) {
              x -= (width - w * H) / 2 / H;
            }
            if (h * W < height) {
              y -= (height - h * W) / 2 / W;
            }
          }
          return {
            dx: -x,
            dy: -y,
            scale: size
          };
        }(newBox[0], newBox[1], newBox[2], newBox[3], true));
      }());

      map.renderCallback();
    };
    
    d3.json(conf.geoDataPath + conf.mapId + ".json", function (json) {
      render(conf.mapId, json);
    });
  };

  /**
   * 清除画布
   */
  Chinamap.prototype.clearCanvas = function () {
    this.paper.clear();
  };

  /**
   * 计算布局位置，并渲染图表
   */
  Chinamap.prototype.render = function (callback) {
    this.renderCallback = callback || this.renderCallback;
    this.clearCanvas();
    this.layout();
    this.generatePaths();
  };

  /**
   * 将点在矢量图中的位置 转化为 实际显示点相对于图片左上角的位置（像素距离）
   */
  Chinamap.prototype._scaleLocToPixelLoc = function (scaleLoc) {
    var map = this;
    var scale = map.viewBoxShift.scale;
    var viewCenter = {
      'x': map.viewBox[0] + map.viewBox[2] / 2,
      'y': map.viewBox[1] + map.viewBox[3] / 2
    };
    return {
      'x': (scaleLoc.x - viewCenter.x) * scale + map.defaults.width / 2,
      'y': (scaleLoc.y - viewCenter.y) * scale + map.defaults.height / 2
    };
  };

  /**
   * 将实际显示点相对于图片左上角的位置（像素距离） 转化为 点在矢量图中的位置
   */
  Chinamap.prototype._pixelLocToScaleLoc = function (pixelLoc) {
    var map = this;
    var scale = map.viewBoxShift.scale;
    var viewCenter = {
      'x': map.viewBox[0] + map.viewBox[2] / 2,
      'y': map.viewBox[1] + map.viewBox[3] / 2
    };
    return {
      'x': (pixelLoc.x - map.defaults.width / 2) / scale + viewCenter.x,
      'y': (pixelLoc.y - map.defaults.height / 2) / scale + viewCenter.y
    };
  };

  /**
   * 渲染城市点
   */
  Chinamap.prototype.createCityPoints = function (cities, callback) {
    var map = this;
    var point;
    var points = [];
    var cb = callback || function (city) {
      return this.paper.circle(city.coord[0], city.coord[1], 20).attr({
        "fill": "steelblue",
        "fill-opacity": 0.5
      });
    };

    cities.forEach(function (d) {
      //get format name
      var formatName = map.getCityFormatName(d.name);
      if (typeof formatName === 'undefined') {
        if (typeof d.lanlon === 'undefined') {
          return;
        } else {
          d.formatName = d.name;
        }
      } else {
        d.formatName = formatName;
        //get loc (lan, lon), use user provided lanlon by default;
        d.lanlon = d.lanlon || map.getCityCenter(d.formatName);
      }
      // process loc (geo projection)
      d.coord = map.projection(d.lanlon);
      // x and y of circle center in the container;
      d.pointLoc = map._scaleLocToPixelLoc({
        'x': d.coord[0],
        'y': d.coord[1]
      });
      // callback
      point = cb.call(map, d);
      points.push(point);
    });
    return points;
  };

  /*!
   * 导出Chinamap
   */
  return Chinamap;
});
