/**
 * Created by taotao on 2016/10/8.
 */
"use strict";
var util = require("util");
var User = require('../db/libraryModels').User;
const crypto = require('crypto');
var dataSorter = require('../utils/DataSorter');

function sha1(source) {
    return crypto.createHash('sha1', '').update('' + source).digest('hex');
}
function add(user, callback, errorHandler) {
    User.count({
        where: {
            code: user.code
        }
    }).then(function (ret) {
        if (ret > 0) {
            errorHandler({flag: false, msg: '工号已存在!'});
        } else {
            user.password = sha1(user.password);
            User.create(user).then(callback).catch(errorHandler);
        }
    }).catch(errorHandler);
}
function bulkAdd(users, callback, errorHandler) {
    var sortedUsers = dataSorter.sort(users,function (user) {
        user.password = sha1(user.password || '66666666');
    });
    if(users){
        var avail = sortedUsers.avail,
            repeated = sortedUsers.repeated,
            missed = sortedUsers.missed;
        if (avail.size>0) {
            var codes = [];
            for(let key of avail.keys()){
                codes.push(key);
            }
            User.findAll({
                where: {
                    code: {
                        $in: codes
                    }
                }
            }).then(function (result) {
                if (result && result.length > 0) {
                    result.forEach(function (item) {
                        repeated.push(item);
                        avail.delete(item.code);
                    });
                }
                if(avail.size>0) {
                    var toAdded = [];
                    for(let item of avail.values()){
                        toAdded.push(item);
                    }
                    User.bulkCreate(toAdded, {validate: true}).then(function (ret) {
                        callback({
                            flag:true,
                            inserted:ret.length,
                            repeated:repeated,
                            missed:missed
                        })
                    }).catch(function (e) {
                        errorHandler(e);
                    });
                }else{
                    callback({
                        flag:true,
                        repeated:repeated,
                        missed:missed
                    });
                }
            });
        }
    }
}
/**
 *
 * @param user 可以为id数组[1,2...],或者单个id 1,2,..或者带有id属性的对象{id:1}
 * @param callback
 * @param errorHandler
 */
function remove(user, callback, errorHandler) {
    var ids = null;
    if (util.isArray(user)) {
        ids = user;
    } else if (util.isPrimitive(user)) {
        ids = [user];
    } else if (util.isObject(user) && !util.isNullOrUndefined(user.id)) {
        ids = [user.id];
    } else {
        errorHandler({msg: 'wrong params'});
        return;
    }
    User.update({deleted: true}, {
        fields: ['deleted'],
        where: {
            id: {
                $in: ids
            }
        }
    })
        .then(callback)
        .catch(errorHandler);
}

/**
 * 更新用户信息(不更新密码,创建时间,修改时间)
 * @param user
 * @param callback
 * @param errorHandler
 */
function update(user, callback, errorHandler) {
    if (!util.isObject(user) || util.isNullOrUndefined(user.id)) {
        errorHandler({msg: 'no id'});
        return;
    }
    User.findById(user.id).then(function (oldUser) {
        if (oldUser.id) {
            var fields = Object.keys(User.attributes).filter(function (key) {
                return !({'password': 1, 'createdAt': 1, 'updatedAt': 1}[key]);
            });
            oldUser.update(user, {fields: fields}).then(callback).catch(errorHandler);
            // console.log(key);
        }
    }).catch(errorHandler)
}
function updatePassword(id, password, new_password, callback) {
    User.findById(id).then(function (user) {
        if (user.id && user.password == password) {
            user.update({password: new_password}, {fields: ['password']}).then(callback).catch(function () {
                callback({flag: false, msg: '服务器错误!'});
            });
        } else {
            callback({flag: false, msg: '密码错误!'});
        }
    }).catch(function () {
        callback({flag: false, msg: '服务器错误!'});
    })
}
function resetPassword(id, callback) {
    User.findById(id).then(function (user) {
        if (user.id) {
            user.update({password: sha1('66666666')}, {fields: ['password']}).then(callback).catch(function () {
                callback({flag: false, msg: '服务器错误!'});
            });
        }
    }).catch(function () {
        callback({flag: false, msg: '服务器错误!'});
    })
}
function query(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var page = params.hasOwnProperty('page') ? parseInt(params.page) : 1,
        rows = params.hasOwnProperty('rows') ? parseInt(params.rows) : 10,
        where = {deleted: false, id: {$gt: 1}};
    if (params.name) {
        where.$or = {
            name: {
                $like: ['%', params.name, '%'].join('')
            },
            code: {
                $like: ['%', params.name, '%'].join('')
            }
        };
    }
    if (params.role) {
        where.role = params.role;
    }
    User.findAndCountAll({
        attributes: {exclude: ['password']},
        where: where,
        offset: (page - 1) * rows,
        limit: rows,
        order: [
            ['updatedAt', 'desc']
        ]
    }).then(function (result) {
        result.total = result.count;
        delete result.count;
        callback(result);
    });

}
function queryAll(params, callback) {
    if (!util.isObject(params)) {
        callback();
        return;
    }
    var where = {deleted: false};
    if (params.name) {
        where.name = {$like: ['%', params.name, '%'].join('')};
    }
    if (params.code) {
        where.code = {$like: ['%', params.code, '%'].join('')};
    }
    if (params.role) {
        where.role = params.role;
    }
    User.findAndCountAll({
        where: where,
        order: [
            ['updatedAt', 'desc']
        ]
    }).then(function (result) {
        result.total = result.count;
        delete result.count;
        callback(result);
    });

}

function findByUsernamePassword(username, password, callback) {
    User.findOne({
        where: {
            code: username,
            password: password,
            deleted: false
        }
    }).then(callback);
}

function findById(id, callback, errHandler) {
    User.findById(id).then(callback).catch(errHandler);
}
function getNewInstance(callback) {
    var user = User.build({});
    callback(user);
}

module.exports = {
    add: add,
    bulkAdd: bulkAdd,
    remove: remove,
    update: update,
    query: query,
    queryAll: queryAll,
    findById: findById,
    findByUsernamePassword: findByUsernamePassword,
    getNewInstance: getNewInstance,
    updatePassword: updatePassword,
    resetPassword: resetPassword
}


