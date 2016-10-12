/**
 * Created by taotao on 2016/10/11.
 */
"use strict";
var util = require("util");
var dateFormatter = require('../utils/DateFormater');
var db = require('../db/libraryModels');
var Seq = db.Seq;
var seq = db.seq;
var Record = db.Record;
var User = db.User;
var Book = db.Book;
var RECORD_STATUS = db.CONST_RECORD_STATUS;
function borrow(user_id, period, book_ids, callback) {
    if (!user_id || !util.isArray(book_ids) || book_ids.length < 1) {
        callback();
    }
    var code = dateFormatter.format(new Date(), 'yyyyMMddhhmmss');
    var borrow_date = new Date();
    var deadline = new Date(borrow_date.getTime() + 1000 * 60 * 60 * 24 * period);
    seq.transaction(function (t) {
        return Promise.all(book_ids.map(function (book_id) {
            return Record.create({
                code: code,
                userId: user_id,
                bookId: book_id,
                borrow_date: borrow_date,
                deadline: deadline,
                return_status: RECORD_STATUS.BORROWED
            }, {transaction: t});
        }));
    })
        .then(callback)
        .catch(function (err) {
            callback();
        });

}
function query(username, bookname, callback) {
    var user_where = {deleted: false},
        book_where = {deleted: false};
    if (username) {
        var username_like = ['%', username, '%'].join('');
        user_where.$or = {
            name: {
                $like: username_like
            },
            code: {
                $like: username_like
            }
        }
    }
    if (bookname) {
        var bookname_like = ['%', username, '%'].join('');
        user_where.$or = {
            name: {
                $like: bookname_like
            },
            code: {
                $like: bookname_like
            }
        }
    }
    user_where.id = Seq.col('record.bookId');
    book_where.id = Seq.col('record.userId');
    Record.findAndCountAll({
        include: [{
            model: User,
            where: user_where
        }, {
            model: Book,
            where: book_where
        }]
    }).then(function (result) {
        result.total = result.count;
        delete result.count;
        callback(result);
    });
}
/**
 *
 * @param return_list 归还信息列表,每个记录需要包含record_id,return_status
 * @param callback
 * @private
 */
function return_(return_list, callback) {
    if (!util.isArray(return_list)) {
        callback();
    }
    var list = [];
    return_list.forEach(function (item) {
        if (item && item.record_id) {
            list.push({
                where: {id: item.record_id},
                info: {return_status: item.return_status || RECORD_STATUS.RETURNED}
            })
        }
    });
    seq.transaction(function (t) {
        return Promise.all(list.map(function (item) {
            Record.update(item.info, {fields: 'return_status', where: item.where}, {transaction: t});
        }));
    }).then(callback);
}
// add(1,1,[1,1,1,1,1,1,1],function (result) {
//     console.log(JSON.stringify(result));
// });

// query('12', null, function (result) {
//     console.log(JSON.stringify(result));
// });
// return_([{record_id:1,return_status:RECORD_STATUS.RETURNED}],function (result) {
//     console.log(JSON.stringify(result.length));
// });
// borrow(1,30,[1,2],function (result) {
//     console.log(result);
// })
module.exports = {
    borrow: borrow,
    return_: return_,
    query: query
}