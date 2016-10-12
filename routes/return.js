/**
 * Created by taotao on 2016/10/11.
 */
var express = require('express');
var util = require('util');
var borrowService = require('../service/BorrowService')
var router = express.Router();


router
    .get('/index', function (req, res, next) {
        res.render('return_index');
    });

module.exports = router;