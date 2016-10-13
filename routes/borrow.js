/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService');
var bookService = require('../service/BookService')
var router = express.Router();


router
    .get('/index', function (req, res, next) {
        res.render('borrow_index');
    })
    .get('/select_user', function (req, res, next) {
        res.render('borrow_select_user');
    })
    .post('/action', function (req, res, next) {
        var user_id =req.body.user_id,
            period = req.body.period,
            book_ids = req.body.book_ids;
        if (!user_id || !util.isArray(book_ids) || book_ids.length < 1) {
            res.json({flag: false, msg: 'invalid user_id or book_ids'});
        }
        bookService.markBorrowed(book_ids,user_id,function (result) {
            if (result.length > 0) {
                res.json({
                    flag: true,
                    msg: 'success'
                });
            }
        },function () {
            res.json({
                flag: false,
                msg: 'error'
            })
        })
    })
    .post('/return',function (req,res,next) {
        var return_set = {};
        req.body.return_set.forEach(function (item) {
            return_set[item.id]= item.status;
        });
        bookService.markReturned(return_set,function (result) {
            if (result.length > 0) {
                res.json({
                    flag: true,
                    msg: 'success'
                });
            }
        },function () {
            res.json({
                flag: false,
                msg: 'error'
            })
        });
    })
    .get('/record',function (req,res,next) {
        res.render('records_index');
    })
    .get('/list', function (req, res, next) {
        var username = req.query.username,
            bookname = req.query.bookname;
        borrowService.query(username, bookname, function (result) {
            res.json(result);
        });
    });

module.exports = router;