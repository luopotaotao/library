"use strict"
var express = require('express');
var router = express.Router();
var userService = require('../service/UserService');
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
    });

module.exports = router;
