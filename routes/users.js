"use strict"
var express = require('express');
var router = express.Router();
var userService = require('../service/UserService');

var multer = require('multer');
var upload = multer({dest: 'upload/'}).single('file');
var fs = require('fs');
var responseUtil = require('../utils/responseUtil');
var excelUtil = require('../utils/excelUtil');
var objUtil = require('../utils/ObjectUtil');
var dateUtil = require('../utils/DateFormater');

/* GET users listing. */
router
    .get('/index', function (req, res, next) {
        res.render('users_index');
    })
    .get('/get/:id', function (req, res, next) {
        userService.findById(req.params.id, function (user) {
            let ret = (user && user.id) ? user.get({plain: true}) : {flag: false, msg: 'no record'};
            res.json(ret);
        });
    })
    .get('/list', function (req, res, next) {
        userService.query(req.query, function (result) {
            res.json(result || {total: 0, rows: []});
        });
    })

    .post('/add', function (req, res, next) {
        userService.add(req.body, function (user) {
            let ret = user && user.id ? {
                flag: 1,
                msg: '添加成功'
            } : {
                flag: false,
                msg: '添加失败!'
            };
            res.json(ret);
        })
    })
    .post('/delete', function (req, res, next) {
        userService.remove(req.body.ids, function (count) {
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
    .post('/update', function (req, res, next) {
        var user = req.body;
        if (user && user.id) {
            userService.update(user, function (result) {
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
    .get('/template', function (req, res, next) {
        res.download('public/file_template/user_template.xlsx', '用户数据导入模板.xlsx', function(err){
            if (err) {
                console.log(err);
            } else {
            }
        });
    })
    .get('/export', function (req, res, next) {
        userService.queryAll(req.query,function (result) {
            var rows = result.rows.map(function (item) {
                return [
                    item['code']||'',
                    item['name']||'',
                    {M:'男',F:'女'}[item['gender']]||'',
                    item['birth']?dateUtil.format(item['birth'],'yyyy/MM/dd'):'',
                    item['phone']||'',
                    item['email']||'',
                    item['phone']||''
                ];
            });
            rows.unshift(['姓名','性别','出生日期','借阅周期','角色','电话','邮箱']);
            var date = dateUtil.format(new Date(),'yyyy年MM月dd日hh时mm分鸿合用户信息')+'.xlsx';
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
            var l = excelUtil.parseUseList(req.file.path);
            console.log(l);
            function removeTmpFile() {
                fs.unlink(req.file.path, function (e) {
                    console.log(e);
                });
            }
            userService.bulkAdd(l,
                function (result) {
                    removeTmpFile();
                    res.json({flag: true, msg: '成功导入' + result.length + '条数据'});
                }, function (e) {
                    console.log(e);
                    removeTmpFile();
                    res.json({
                        flag: false,
                        msg: '导入失败,请使用导入数据模板导入数据!'
                    });
                });
        });
    })


;

module.exports = router;
