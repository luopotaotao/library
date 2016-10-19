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
/**
 * 查询借阅记录
 * @param username 用户名
 * @param bookname 图书名
 * @param callback
 */
const sql_query_records =`
select * from record_books
where (name like :name or uname like :name) limit :page,:rows order by updatedAt desc
`,
    sql_query_records_count = `
select count(*) c from record_books
where (name like :name or uname like :name)
`
function query(params, callback) {
    var record_where = {deleted: false};
    if (username) {
        record_where.name =['%', params.name, '%'].join('');
    }
    seq.query(sql_query_records_count,{
        replacements:record_where
    }).then(function (count) {
        return count.length?count[0].c:0;
    }).then(function (c) {
        if(c){
            var page = parseInt(params.page);
            var rows = parseInt(params.rows);
            record_where.page = page>0?page-1:0;
            record_where.rows = rows>0?rows:10;
            seq.query(sql_query_records,{replacements:record_where}).then(function (records) {
                callback({total:c,rows:records});
            })
        }else{
            callback();
        }
    });
}

function list(name,callback) {
    var user_where = {deleted: false},
        book_where = {deleted: false};
    if (name) {
        var bookname_like = ['%', decodeURIComponent(name), '%'].join('');
        book_where.$or = {
            name: {
                $like: bookname_like
            },
            code: {
                $like: bookname_like
            }
        }
    }
    book_where.id = Seq.col('record.bookId');
    Record.findAndCountAll({
        include: [{
            model: User,
            where: user_where,
            required: false
        }, {
            model: Book,
            where: book_where,
            required: false
        }],
        order: [
            ['updatedAt', 'desc']
        ]
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
// return_([{record_id:1,return_status:BOOK_STATUS.RETURNED}],function (result) {
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