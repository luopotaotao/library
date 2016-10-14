"use strict"
var express = require('express');
var router = express.Router();
var bookService = require('../service/BookService');

var multer = require('multer');
var upload = multer({dest: 'upload/'}).single('file');
var fs = require('fs');
var responseUtil = require('../utils/responseUtil');
var excelUtil = require('../utils/excelUtil');
var objUtil = require('../utils/ObjectUtil');
var dateUtil = require('../utils/DateFormater');

router
    .get('/index', function (req, res, next) {
        res.render('books_index');
    })
    .get('/template', function (req, res, next) {
        res.download('public/file_template/book_template.xlsx', '图书数据导入模板.xlsx', function(err){
            if (err) {
                console.log(err);
            } else {
            }
        });
    })

    .get('/export', function (req, res, next) {
        if (req.query.name) {
            req.query.name = decodeURIComponent(req.query.name);
        }
        bookService.queryAll(req.query,function (result) {
            var rows = result.rows.map(function (item) {
                return [
                    item['name']||'',
                    item['code']||'',
                    item['author']||'',
                    item['translator']||'',
                    item['publisher']||'',
                    item['date']?dateUtil.format(item['date'],'yyyy/MM/dd'):'',
                    item['price']||''
                ];
            });
            rows.unshift(['书名','图书编号','作者','译者','出版社','出版日期','价格']);
            var date = dateUtil.format(new Date(),'yyyy年MM月dd日hh时mm分鸿合图书信息')+'.xlsx';
            var buffer = excelUtil.generateXlsx('sheet1', rows);
            responseUtil.setXlsxResponseHeaders(res,encodeURIComponent(date));
            res.write(buffer);
            res.end();
        });
    })
    .post('/import', function (req, res, next) {
        upload(req, res, function (err) {
            if (err) {
                res.json({
                    flag: false,
                    msg: '文件传输错误!'
                });
                return;
            }
            try {
                var l = excelUtil.parseBookList(req.file.path);
            } catch (e) {
                console.log(e);
            }
            function removeTmpFile() {
                fs.unlink(req.file.path, function (e) {
                    console.log(e);
                });
            }
            bookService.bulkAdd(l,
                function (result) {
                    removeTmpFile();
                    res.json({flag: true, msg: '成功导入' + result.length + '条数据'});
                }, function () {
                    removeTmpFile();
                    res.json({
                        flag: false,
                        msg: '导入失败,请使用导入数据模板导入数据!'
                    });
                });
        });
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
        if (req.query.name) {
            req.query.name = decodeURIComponent(req.query.name);
        }
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
