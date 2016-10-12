"use strict"
var express = require('express');
var router = express.Router();
var bookService = require('../service/BookService');

var multer = require('multer');
var upload = multer({dest: 'upload/'}).single('avatar');
var fs = require('fs');
var responseUtil = require('../utils/responseUtil');
var excelUtil = require('../utils/excelUtil');
var objUtil = require('../utils/ObjectUtil')
var dateUtil =  require('../utils/DateFormater')

router
    .get('/index', function (req, res, next) {
        res.render('books_index');
    })
    .get('/export', function (req, res, next) {
        //TODO 从数据库加载数据并生成响应的格式
        const data = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']];
        var buffer = excelUtil.generateXlsx('sheetName', data);
        responseUtil.setXlsxResponseHeaders(res);
        res.write(buffer);
        res.end();
    })
    .post('/', function (req, res, next) {
        upload(req, res, function (err) {
            if (err) {
                // 发生错误
                return
            }
            var l = excelUtil.parseBookList(req.file.path);
            //TODO 数据入库
            fs.unlink(req.file.path, function (e) {
                console.log(e);
            });
            res.json({flag: true});
        })
    })
    .post('/delete', function (req, res, next) {
        bookService.remove(req.body.ids, function (count) {
            var ret = count ? {
                flag: count,
                msg: '删除成功'
            } : {
                flag: count,
                msg: '删除失败'
            };
            res.json(ret);
        });

    })
    .post('/add', function (req, res, next) {
        var book = objUtil.clean(req.body);
        if (book.date) {
            book.date = new Date(book.date);
        }
        bookService.add(book, function (book) {
            let ret = book && book.id ? {
                flag: 1,
                msg: '添加成功'
            } : {
                flg: false,
                msg: '添加失败'
            };
            res.json(ret);
        })
    })
    .get('/get/:id', function (req, res, next) {
        bookService.findById(req.params.id, function (book) {
            let ret = (book && book.id) ? book.get({plain: true}) : {flag: false, msg: 'no record'};
            res.json(ret);
        });
    })
    .get('/queryByIds', function (req, res, next) {
        bookService.queryByIds(req.ids, function (result) {
            res.json(result || {total: 0, rows: []});
        });
    })
    .get('/list', function (req, res, next) {
        bookService.query(req.query, function (result) {
            res.json(result || {total: 0, rows: []});
        });
    })
    .post('/update', function (req, res, next) {
        var book = objUtil.clean(req.body);
        if (book.date) {
            book.date = new Date(book.date);
        }
        if (book && book.id) {
            bookService.update(book, function (result) {
                let ret = result ? {
                    flag: 1,
                    msg: '更新成功'
                } : {
                    flag: false,
                    msg: '更新失败!'
                };
                res.json(ret);
            });
        }
    })
;

module.exports = router;
