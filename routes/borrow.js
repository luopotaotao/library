/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService')
var router = express.Router();


router
    .get('/index', function (req, res, next) {
        res.render('borrow_index');
    })
    .post('/action', function (req, res, next) {
        var user_id = req.body.user_id,
            book_ids = req.body.book_ids;
        if (!user_id || !util.isArray(book_ids) || book_ids.length < 1) {
            res.json({flag: false, msg: 'invalid user_id or book_ids'});
        }
        borrowService.borrow(user_id, book_ids, function (result) {
            if (result.length > 0) {
                res.json({
                    flag: true,
                    msg: 'success'
                });
            }
        });
    })
    .get('/list', function (req, res, next) {
        var username = req.query.username,
            bookname = req.query.bookname;
        borrowService.query(username, bookname, function (result) {
            res.json(result);
        });
    });

module.exports = router;