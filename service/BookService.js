/**
 * Create by tt on 2016/10/12
 */
"use strict";
var util = require("util");
var Book = require('../db/libraryModels').Book;

function add(book, callback, errorHandler){
    Book.create(book).then(callback).catch(errorHandler);
}
/**
 * 删除书籍信息
 *@param book 可以为id数组[1,2...],或者单个id 1,2,..或者带有id属性的对象{id:1}
 *@param book callback
 *@param errorHandler
 */
function remove(book, callback, errorHandler){
    var ids = null;
    if (util.isArray(book)) {
        ids = book;
    } else if (util.isPrimitive(book)) {
        ids = [book];
    } else if (util.isObject(book)&&!util.isNullOrUndefined(book.id)) {
        ids = [book.id];
    } else {
        errorHandler({msg: 'wrong params'});
        return;
    }
    /*
     Book.destroy({
     where: {
     id:{
     $in: ids
     }
     }
     })*/
    Book.update({deleted: true}, {
        fields: ['deleted'],
        where: {
            id: {
                $in: ids
            }
        }
    })
        .then(callback)
        .catch(errorHandler);
}
/**
 * 更新书籍信息(不更新创建时间,修改时间)
 * @param user
 * @param callback
 * @param errorHandler
 */
function update(book, callback, errorHandler) {
    if(!util.isObject(book)||util.isNullOrUndefined(book.id)){
        errorHandler({msg:'no id'});
        return;
    }
    Book.findById(book.id).then(function (oldBook) {
        if(oldBook.id){
            var fields = Object.keys(Book.attributes).filter(function (key) {
                return !({'createdAt':1}[key]);
            });
            oldBook.update(book,{fields:fields}).then(callback).catch(errorHandler);
            // console.log(key);
        }
    }).catch(errorHandler)
}
/**
 * 根据名称||(&&)书号查询书籍信息
 * 根据书籍借阅状态查询书籍信息
 * @param params ：name,code 可选，page
 * @param params ：status 可选，page
 * @param callback
 * @param errorHandler
 */
function query(params, callback){
    if(!util.isObject(params)){
        callback();
        return;
    }
    var page = params.hasOwnProperty('page')?parseInt(params.page):1,
        rows = params.hasOwnProperty('rows')?parseInt(params.rows):10,
        where = {deleted:false};
    if(params.name){
        where.name={$like:['%',params.name,'%'].join('')};
    }
    if(params.code){
        where.code={$like:['%',params.code,'%'].join('')};
    }
    if(params.status){
        where.status={$in:[params.status].join('')};
    }
    Book.findAndCountAll({
        where:where,
        offset:(page-1)*rows,
        order:'name asc',
        limit:rows
    }).then(function(result){
        result.total = result.count;
        delete result.count;
        callback(result);
    });
}

/**
 * 根据id查询书籍信息
 * @param params ：id
 * @param callback
 */
function findById(id,callback){
    Book.findById(id).then(callback);
}

/**
 * 根据ids查询书籍信息
 * @param params ：ids
 * @param callback
 */
function queryByIds(ids,callback){
    var params = null;
    if(!util.isObject(ids)||util.isNullOrUndefined(ids)||!util.isArray(ids)){
        callback();
        return;
    }
    var where = {};
    where.id={$in:ids};
    where.deleted={$ne:true};

    Book.findAndCountAll({
        where:where,
        order:'name asc'
    }).then(function(result){
        console.log(result.count);
        console.log(result.rows);
        callback(result);
    });
}
module.exports={
    add:add,
    remove:remove,
    update:update,
    query:query,
    findById:findById,
    queryByIds:queryByIds
}