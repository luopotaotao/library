/**
 * Created by taotao on 2016/10/12.
 */
var util = require('util');

function clean(obj){
    if(util.isObject(obj)){
        Object.keys(obj).forEach(function (key) {
            if (!obj[key]) {
                delete obj[key];
            }
        });
    }
    return obj;
}

module.exports = {clean:clean}