/**
 * Created by taotao on 2016/10/17.
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


const sql_statistic_count = `
SELECT count(*) c FROM records WHERE userId=:userId AND borrow_date BETWEEN :year_start and :year_end
UNION ALL
SELECT count(*) c FROM records WHERE userId = :userId AND borrow_date BETWEEN :season_start and :season_end
UNION ALL
SELECT count(*) c FROM records WHERE userId = :userId AND borrow_date BETWEEN :month_start and :month_end
UNION ALL
SELECT count(*) c FROM records WHERE userId = :userId and status in('BORROWED','OVERDUE')`;
function userStatistic(user_id,callback) {
    var now = new Date(),
        year = now.getFullYear(),
        month = now.getMonth();
    var year_start = new Date(year, 0, 1),
        year_end = new Date(year, 1, 1),
        month_start = new Date(year, month, 1),
        month_end = new Date(year, month + 1, 1),
        season_start = new Date(year, Math.floor(1 / 3) * 3 + month, 1),
        season_end = new Date(year, Math.floor(1 / 3) * 3 + month + 3, 1);
    seq.query(sql_statistic_count,
        {
            replacements: {
                userId:user_id,
                year_start: 'year_start',
                year_end: 'year_end',
                month_start: 'month_start',
                month_end: 'month_end',
                season_start: 'season_start',
                season_end: 'season_end'
            }, type: seq.QueryTypes.SELECT
        }
    ).then(function (l) {
        var ret = {year_count:l[0].c,season_count:l[1].c,month_count:l[2].c,borrow_count:l[3].c};
        callback(ret);
    });
}

module.exports ={
    userStatistic:userStatistic
}