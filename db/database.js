/**
 * Created by taotao on 2016/10/8.
 */
var Sequelize = require('sequelize');
var seq = new Sequelize('library', 'root', 'admin', {
    host: '127.0.0.1',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

module.exports = {
    seq:seq,
    Sequelize:Sequelize
};