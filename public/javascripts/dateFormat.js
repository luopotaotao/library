/**
 * Created by taotao on 2016/10/12.
 */
function format(date, template) {
    if(!date){
        return null;
    }
    if(!(date instanceof Date)){
        try{
            date = new Date(date);
        }catch(e) {
            return null;
        }
    }
    if(!date){
        return null;
    }
    var o =
    {
        "M+": date.getMonth() + 1, //month
        "d+": date.getDate(),    //day
        "h+": date.getHours(),   //hour
        "m+": date.getMinutes(), //minute
        "s+": date.getSeconds(), //second
        "q+": Math.floor((date.getMonth() + 3) / 3),  //quarter
        "S": date.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(template))
        template = template.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(template))
            template = template.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return template;
}
$.extend({
    formatDate:format
})