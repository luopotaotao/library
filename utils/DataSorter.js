/**
 * Created by taotao on 2016/10/20.
 */
var util = require('util');
function sort(items,func) {
    if (util.isArray(items)) {
        var avail = new Map(),
            repeated = [],
            missed = [];
        var needAdditionOperation = typeof func==='function';
        items.forEach(function (item) {
            if (item.code && item.name) {
                if (avail.get(item.code)) {
                    repeated.push(item);
                } else {
                    if(needAdditionOperation){
                        func(item);
                    }
                    avail.set(item.code+'',item);
                }
            } else {
                missed.push(item);
            }
        });
        return {
            avail: avail,
            repeated: repeated,
            missed: missed
        }
    }else{
        return null;
    }
}

module.exports = {
    sort:sort
}