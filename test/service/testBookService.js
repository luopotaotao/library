/**
 * Created by taotao on 2016/10/8.
 */
var BookService = require('../../service/BookService');


BookService.removeBook(2,function (ret) {
    console.log(ret);
});
/*
BookService.add({name:'我的第一本',code:'003c'},function(book){
    console.log(book.id,book.name);
});

BookService.update({id:6,name:'我的第六本'},function (book) {
    console.log(book.id,book.name);
});
 */
/*
BookService.query({name:'我的第六本'},function (result) {
    console.log(result);
});
*/
/*
BookService.findById('6',function (result) {
    console.log(result);
})
    */
/*
var arr = [2,3];
BookService.queryByIds(arr,function (result) {
    console.log(result);
})
*/
