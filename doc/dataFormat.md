/*以下描述可视化使用说明主要针对数据库表格，一个field项表示表格某个列,
  type 表示类型， "string" 或 "number" 或 "string or number";
  required 表示该项可选还是必须， true 或 false;
  count 表示field出现的数量，"1", "2", "3", ... （指定数字）或 "1+", "2+", .....（指定最小数） 或 "1-2", "2-5"（指定范围）;
 */
/**
 * 饼图、单层treemap字段描述 (Pie, Treemap)
 */
fields = {
    label: {
        type: "string",
        required: false,
        count : "1"
    },
    value: {
        type: "number",
        required: true,
        count : "1"
    }
};

/**
 * line, area, bar, column字段描述 //stream应该也是这个格式，但目前没有加入
 */
fields = {
    label: {
        type: "string",
        required: false,
        count : "1"
    },
    value: {
        type: "number",
        required: true,
        count : "1+"
    }
};


/**
 * scatter字段描述
 */
fields = {
    label: {
        type: "string",
        required: false,
        count : "1"
    },
    x_value: {
        type: "number",
        required: true,
        count : "1"
    },
    y_value: {
        type: "number",
        required: true,
        count : "1"
    }
};

/**
 * parallel字段描述
 */
fields = {
    label: { //目前组件是没有label的，但可以考虑添加。
        type: "string",
        required: false,
        count : "1"
    },
    value: {
        type: "string or number",
        required: true,
        count : "2+"
    }
};


/**
 * scatterplotmatrix字段描述
 */
fields = {
    label: { //目前组件是没有label的，但可以考虑添加。
        type: "string",
        required: false,
        count : "1"
    },
    value: {
        type: "string or number",
        required: true,
        count : "2+"
    }
};



