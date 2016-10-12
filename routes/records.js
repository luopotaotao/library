/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService')
var router = express.Router();


router
    .get('/index',function (req,res,next) {
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