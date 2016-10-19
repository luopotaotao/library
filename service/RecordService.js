/**
 * Created by taotao on 2016/10/13.
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
var BOOK_STATUS = db.CONST_BOOK_STATUS;

/**
 * 标识图书借阅
 * 两步:1,将图书标记为已借阅,并标记借阅人id;2,生成借阅记录
 * @param book_id 图书id
 * @param user_id 用户id
 * @param callback
 * @param errorHandler
 */
function markBorrowed(book_ids, user_id, callback, errorHandler) {

    var book_query = {
        where: {
            id: {
                $in: book_ids
            },
            recordId:{
                $eq:null
            }
        }
    }
    Book.count(book_query).then(function (count) {
        //查询到的数据与前端发送过来的数据不一致,说明数据已过时
        if (count != book_ids.length) {
            errorHandler({flag: false, msg: '数据已过期,请刷新重试!'});
        }else{
            User.findById(user_id).then(function (user) {
                if (user && user.id) {
                    Book.findAll(book_query).then(function (books) {
                        if (books && books.length) {
                            seq.transaction(
                                function (t) {
                                    var borrow_date = new Date();
                                    var trans = [];
                                    books.forEach(function (book) {
                                        var book_id = book.id;
                                        var period = (user.period || 30) * 1000 * 60 * 60 * 24;
                                        var log_insert = Record.create({
                                            bookId: book.id,
                                            code: book.code,
                                            userId: user_id,
                                            borrow_date: borrow_date,
                                            deadline: new Date(borrow_date.getTime() + period),
                                            status: BOOK_STATUS.BORROWED
                                        }, {
                                            transaction: t
                                        });
                                        trans.push(log_insert);
                                    });
                                    return Promise.all(trans);
                                }
                            ).then(callback).catch(errorHandler);
                        }
                    });
                } else {
                    console.log(arguments);
                    errorHandler({
                        flag: false,
                        msg: '用户不存在!'
                    });
                }
            });

        }

    });
}

/**
 *
 * @param return_set 类似 {1:'IN',3:'MISSED'}
 * @param callback
 * @param errHandler
 */
function markReturned(return_set, callback, errHandler) {

    var ids = Object.keys(return_set);
    var record_query = {
        where: {
            id: {
                $in: ids
            },
            status: BOOK_STATUS.BORROWED
        }
    }
    Record.count(record_query).then(function (count) {
        //查询到的数据与前端发送过来的数据不一致,说明数据已过时
        if (count !=ids.length) {
            errHandler({flag: false, msg: '数据已过期,请刷新重试!'});
            return;
        }
        var now = new Date();
        seq.transaction(function (t) {
            let trans = [];
            for(let key in return_set){
                trans.push(Record.update({
                    status:return_set[key],
                    return_date:now
                },{
                    fields:['status','return_date'],
                    where:{
                        id:key
                    }
                }));
            }
            return Promise.all(trans);
        }).then(callback).catch(errHandler);
    })
}

/**
 * 根据名称||(&&)书号查询书籍信息
 * 根据书籍借阅状态查询书籍信息
 * @param params ：name,code 可选，page
 * @param params ：status 可选，page
 * @param callback
 * @param errorHandler
 */
const sql_query_records = `
SELECT * FROM
	(
		SELECT
			r.id,
			r.borrow_date,
			r.return_date,
			r.deadline,
			r.STATUS,
			u.id uid,
			u. NAME uname,
			b.id bid,
			b.code bcode,
			b. NAME bname
		FROM
			records r
		LEFT JOIN books b ON bookId = b.id
		LEFT JOIN users u ON userId = u.id
	) AS t
WHERE
	(t.uname LIKE :name or t.bname LIKE :name)
	and
	STATUS in (:status)

`;
// limit :page,:rows
function query(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var page = params.hasOwnProperty('page') ? parseInt(params.page) : 1,
        rows = params.hasOwnProperty('rows') ? parseInt(params.rows) : 10,
        name = params.name?'%'+params.name+'%':'';

    seq.query(sql_query_records,
        {
            replacements: {
                name:'%'+(params.name||'')+'%',
                status: params.status||['BORROWED','RETURNED','OVERDUE','MISSED'],
                // page:page>0?page-1:0,
                // rows:rows
            }, type: seq.QueryTypes.SELECT
        }
    ).then(function (l) {
        callback({total:l.length,rows:l});
    });
}

const sql_query_records_by_uid = `
SELECT * FROM
	(
		SELECT
			r.id,
			r.borrow_date,
			r.return_date,
			r.deadline,
			r.STATUS,
          r.updatedAt,
			u.id uid,
			u.NAME uname,
			b.id bid,
			b.code bcode,
			b.NAME bname
		FROM
			records r
		LEFT JOIN books b ON bookId = b.id
		LEFT JOIN users u ON userId = u.id
	) AS t
WHERE
	t.uid=:uid
order by updatedAt desc
`;

function queryRecordsByUserId(uid,callback) {
    seq.query(sql_query_records_by_uid,
        {
            replacements: {
                uid:uid
            }, type: seq.QueryTypes.SELECT
        }
    ).then(function (l) {
        callback({total:l.length,rows:l});
    });
}

// Record.create({bookId:1}).then(function (ret) {
//     console.log(ret);
// })


// query({page:1,rows:10},function (ret) {
//     console.log(ret);
// })
module.exports = {
    markBorrowed: markBorrowed,
    markReturned: markReturned,
    query:query,
    queryRecordsByUserId
}