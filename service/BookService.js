/**
 * Create by tt on 2016/10/12
 */
"use strict";
var util = require("util");
var db = require('../db/libraryModels');
var Book = db.Book;
var Record = db.Record;
var User = db.User;
var Seq = db.Seq;
var seq = db.seq;
var BOOK_STATUS = db.CONST_BOOK_STATUS;
var dateFormatter = require('../utils/DateFormater');

function add(book, callback, errorHandler) {
    Book.create(book).then(callback).catch(errorHandler);
}
function bulkAdd(books,callback,errorHandler) {
    Book.bulkCreate(books, { validate: true }).then(callback).catch(errorHandler);
}
/**
 * 删除书籍信息
 *@param book 可以为id数组[1,2...],或者单个id 1,2,..或者带有id属性的对象{id:1}
 *@param book callback
 *@param errorHandler
 */
function remove(book, callback, errorHandler) {
    var ids = null;
    if (util.isArray(book)) {
        ids = book;
    } else if (util.isPrimitive(book)) {
        ids = [book];
    } else if (util.isObject(book) && !util.isNullOrUndefined(book.id)) {
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
    if (!util.isObject(book) || util.isNullOrUndefined(book.id)) {
        errorHandler({msg: 'no id'});
        return;
    }
    Book.findById(book.id).then(function (oldBook) {
        if (oldBook.id) {
            var fields = Object.keys(Book.attributes).filter(function (key) {
                return !({'createdAt': 1}[key]);
            });
            oldBook.update(book, {fields: fields}).then(callback).catch(errorHandler);
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
function query(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var page = params.hasOwnProperty('page') ? parseInt(params.page) : 1,
        rows = params.hasOwnProperty('rows') ? parseInt(params.rows) : 10,
        where = {deleted: false};
    if (params.name) {
        where.name = {$like: ['%', decodeURIComponent(params.name), '%'].join('')};
    }
    if (params.code) {
        where.code = {$like: ['%', params.code, '%'].join('')};
    }
    if (params.status) {
        where.status = {$in: params.status};
    }
    Book.findAndCountAll({
        include:[{
            model:User
        }],
        where: where,
        offset: (page - 1) * rows,
        order: 'name asc',
        limit: rows
    }).then(function (result) {
        result.total = result.count;
        delete result.count;
        callback(result);
    });
}
function queryAll(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var where = {deleted: false};
    if (params.name) {
        where.name = {$like: ['%', decodeURIComponent(params.name), '%'].join('')};
    }
    if (params.code) {
        where.code = {$like: ['%', params.code, '%'].join('')};
    }
    if (params.status) {
        where.status = {$in: params.status};
    }
    Book.findAndCountAll({
        include:[{
            model:User
        }],
        where: where,
        order: 'name asc',
    }).then(function (result) {
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
function findById(id, callback) {
    Book.findById(id).then(callback);
}

/**
 * 根据ids查询书籍信息
 * @param params ：ids
 * @param callback
 */
function queryByIds(ids, callback) {
    var params = null;
    if (!util.isObject(ids) || util.isNullOrUndefined(ids) || !util.isArray(ids)) {
        callback();
        return;
    }
    var where = {};
    where.id = {$in: ids};
    where.deleted = {$ne: true};

    Book.findAndCountAll({
        where: where,
        order: 'name asc'
    }).then(function (result) {
        console.log(result.count);
        console.log(result.rows);
        callback(result);
    });
}

/**
 * 标识图书借阅
 * 两步:1,将图书标记为已借阅,并标记借阅人id;2,生成借阅记录
 * @param book_id 图书id
 * @param user_id 用户id
 * @param callback
 * @param errorHandler
 */
function markBorrowed(book_ids, user_id, callback, errorHandler) {
    Book.update({userId: user_id, borrow_date: new Date(), status: BOOK_STATUS.BORROWED}, {
        where: {
            id: {
                $in:book_ids
            }
        }
    })
        .then(callback)
        .catch(errorHandler);
}

/**
 *
 * @param return_set 类似 {1:'IN',3:'MISSED'}
 * @param callback
 * @param errHandler
 */
function markReturned(return_set, callback,errHandler) {
    Book.findAll({
        include:[
            {
                model:User
            }
        ],
        where: {
            id: {
                $in: Object.keys(return_set)
            },
            status:{
                $in:[BOOK_STATUS.BORROWED,BOOK_STATUS.OVERDUE]
            }
        }
    }).then(function (books) {
        //查询到的数据与前端发送过来的数据不一致,说明数据已过时
        if(books.length!=Object.keys(return_set).length){
            errHandler();
            return;
        }
        seq.transaction(function (t) {
            var return_date = new Date();
            var trans = [];
            books.forEach(function (book) {
                var user_id = book.userId;
                var book_id = book.id;
                var user = book.user;
                var period = (user&&user.period)?(1000*60*60*24):null;
                var book_update = Book.update(
                    {
                        userId: null,
                        borrow_date: null,
                        status: BOOK_STATUS.RETURNED
                    },
                    {
                        where: {
                            id: book.id
                        }
                    }, {
                        transaction: t
                    });
                var log_insert = Record.create({
                    code: book.code,
                    userId: user_id,
                    bookId: book_id,
                    borrow_date: book.borrow_date,
                    deadline: period?new Date(book.borrow_date.getTime()+period):null,
                    return_date:return_date,
                    return_status: return_set[book.id]
                }, {
                    transaction: t
                });
                trans.push(book_update);
                trans.push(log_insert);
            })
            return Promise.all(trans);
        })
            .then(callback)
            .catch(errHandler);
    });
}


module.exports = {
    add: add,
    bulkAdd:bulkAdd,
    remove: remove,
    update: update,
    query: query,
    queryAll:queryAll,
    findById: findById,
    queryByIds: queryByIds,
    markBorrowed:markBorrowed,
    markReturned:markReturned
}