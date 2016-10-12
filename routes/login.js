var express = require('express');
var router = express.Router();
var userService = require('../service/UserService');
/* GET users listing. */
router
    .get('/', function (req, res, next) {
        res.render('login');
    })
    .post('/', function (req, res, next) {
        var username = req.body['username'];
        var password = req.body['password'];
        var user = userService.findByUsernamePassword(username,password,function (user) {
            if(user&&user.id){
                req.session.user=user;
                res.json({
                    flag:true,
                    msg:'登陆成功',
                    url:'/'
                });
            }else{
                res.json({
                    flag:false,
                    msg:'用户名或密码错误!'
                })
            }
        })
    })
    .get('/logout',function (req,res,next) {
        delete req.session.user;
        res.redirect('/login')
    })


;

module.exports = router;
