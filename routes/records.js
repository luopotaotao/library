/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService')
var recordService = require('../service/RecordService')
var router = express.Router();


router
    .get('/index',function (req,res,next) {
        res.render('records_index');
    })
    .get('/list', function (req, res, next) {
        var username = req.query.username,
            bookname = req.query.bookname;
        recordService.query({name:username||bookname}, function (result) {
            res.json(result);
        });
    }).get('/selfRecords',function (req,res,next) {
        recordService.queryRecordsByUserId(req.session.user.id,function (ret) {
            res.json(ret);
        })
});

module.exports = router;