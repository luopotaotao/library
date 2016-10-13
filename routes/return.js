/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService');
var bookService = require('../service/BookService');
var BOOK_STATUS = require('../db/libraryModels').CONST_BOOK_STATUS;
var router = express.Router();


router
    .get('/index', function (req, res, next) {
        res.render('return_index');
    })
    .get('/list',function (req,res,next) {
        req.query.status = [BOOK_STATUS.BORROWED,BOOK_STATUS.OVERDUE];
        bookService.query(req.query, function (result) {
            res.json(result || {total: 0, rows: []});
        });
    })
    .post('/return',function (req,res,next) {
        bookService.markReturned(req.body,function (result) {
            if(result){
                res.json({
                    flag:true,
                    msg:'success'
                });
            }else{
                res.json({
                    flag:false,
                    msg:'data wrong'
                });
            }
        },function () {
            res.json({
                flag:false,
                msg:'internal error'
            });
        });
    })
;

module.exports = router;