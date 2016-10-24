/**
 * Create by tt on 2016/10/12
 */
"use strict";
var util = require("util");
var db = require('../db/libraryModels');
var Book = db.Book;
var Record = db.Record;
var BookRecord = db.BookRecord;
var User = db.User;
var Seq = db.Seq;
var seq = db.seq;
var dataSorter = require('../utils/DataSorter');

function add(book, callback, errorHandler) {
    Book.create(book).then(callback).catch(errorHandler);
}

function bulkAdd(books, callback, errorHandler) {
    var sorted = dataSorter.sort(books);
    if(books){
        var avail = sorted.avail,
            repeated = sorted.repeated,
            missed = sorted.missed;
        if (avail.size>0) {
            var codes = [];
            for(let key of avail.keys()){
                codes.push(key);
            }
            Book.findAll({
                where: {
                    code: {
                        $in: codes
                    }
                }
            }).then(function (result) {
                if (result && result.length > 0) {
                    result.forEach(function (item) {
                        repeated.push(item);
                        avail.delete(item.code);
                    });
                }
                if(avail.size>0) {
                    var toAdded = [];
                    for(let item of avail.values()){
                        toAdded.push(item);
                    }
                    Book.bulkCreate(toAdded, {validate: true}).then(function (ret) {
                        callback({
                            flag:true,
                            inserted:ret.length,
                            repeated:repeated,
                            missed:missed
                        })
                    }).catch(function (e) {
                        errorHandler(e);
                    });
                }else{
                    callback({
                        flag:true,
                        repeated:repeated,
                        missed:missed
                    });
                }
            });
        }
    }
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

const sql_query_books = `
SELECT
	id,
	code,
	name,
	author,
	translator,
	publisher,
	date,
	price,
	missed,
	deleted,
	recordId,
	borrow_date,
	deadline,
	return_date,
	status,
	createdAt,
	updatedAt,
	uname
FROM
	book_records AS book_record
WHERE
	book_record.deleted = FALSE
	and ( name like :name or code like :name)
	and  status in(:status)
ORDER BY
    borrow_date desc,updatedAt desc
LIMIT :page,:rows;
`;

const sql_query_books_count = `
SELECT COUNT(*) c
FROM
	book_records AS book_record
WHERE
	book_record.deleted = FALSE
	and ( name like :name or code like :name)
	and status in(:status)
`;
function query(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var where =[];
    var page = params.hasOwnProperty('page') ? parseInt(params.page) : 1,
        rows = params.hasOwnProperty('rows') ? parseInt(params.rows) : 10,
        where = {deleted: false},
        include_record = {
            model: Record,
            required:false
        };
    if (params.name) {
        where.name = {$like: ['%', params.name, '%'].join('')};
        where.code = {$like: ['%', params.code, '%'].join('')};
    }
    if (params.status) {
        where.status = {$in: params.status};
    }
    seq.query(sql_query_books_count,{
        replacements: {
            name:['%', params.name, '%'].join(''),
            status: params.status?[params.status]:['BORROWED','RETURNED','OVERDUE','MISSED'],
        }, type: seq.QueryTypes.SELECT
    }).then(function (ret) {
        return ret.length?ret[0].c:null;
    }).then(function (c) {
        if(c){
            seq.query(sql_query_books,
                {
                    replacements: {
                        name:['%', params.name, '%'].join(''),
                        status: params.status||['BORROWED','RETURNED','OVERDUE','MISSED'],
                        page:page>0?(page-1)*rows:0,
                        rows:rows
                    }, type: seq.QueryTypes.SELECT
                }
            ).then(function (ret) {
                callback({total:c,rows:ret});
            });
        }else{
            callback(null);
        }
    });

}
function queryAll(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var where = {deleted: false},
        include_record = {
            model: Record,
            required:false,
            id: Seq.col('book.recordId')
        };
    if (params.name) {
        where.name = {$like: ['%', params.name, '%'].join('')};
    }
    if (params.code) {
        where.code = {$like: ['%', params.code, '%'].join('')};
    }
    if (params.status) {
        include_record.where = {
            status:{$in: params.status}
        };
    }
    Book.findAndCountAll({
        // include: [include_record],
        attributes: { exclude: ['records'] },
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
        order: [
            ['updatedAt', 'desc']
        ]
    }).then(function (result) {
        console.log(result.count);
        console.log(result.rows);
        callback(result);
    });
}




module.exports = {
    add: add,
    bulkAdd: bulkAdd,
    remove: remove,
    update: update,
    query: query,
    queryAll: queryAll,
    findById: findById,
    queryByIds: queryByIds
}