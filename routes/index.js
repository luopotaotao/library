var express = require('express');
var router = express.Router();

/* GET home page. */
router
    .get('/', function (req, res, next) {
        var index = {SUPER:'index_super',ADMIN:'index_admin',CUSTOM:'index_custom'};
        var user = req.session.user;
        res.render(index[user.role],{user:user});
    })
    .get('/welcome', function (req, res, next) {
        res.render('welcome')
    })
;

module.exports = router;
