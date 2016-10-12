/**
 * Created by taotao on 2016/10/12.
 */
"use strict"
var express = require('express');
var router = express.Router();
var bookService = require('../service/BookService');

router
    .get('/index', function (req, res, next) {
        res.render('booksQuery_index');
    })
    .get('/list', function (req, res, next) {
    bookService.queryBook(req.query, function (result) {
        res.json(result || {total: 0, rows: []});
    });
});

module.exports = router;