/**
 * Created by taotao on 2016/10/8.
 */
"use strict"
var db = require("./database"),
    seq = db.seq,
    Seq = db.Sequelize;
var User = seq.define('user', {
    code: Seq.STRING,
    name: Seq.STRING,
    gender: Seq.ENUM('M', 'F'),//0女,1男
    birth: Seq.DATE,
    period: Seq.INTEGER,
    role: Seq.ENUM('SUPER', 'ADMIN', 'CUSTOM'),//0管理员,1普通用户
    company: Seq.ENUM('company1', 'company2'),
    cost_center: Seq.STRING,
    id_code: Seq.STRING,
    phone: Seq.STRING,
    email: Seq.STRING,
    password: Seq.STRING,
    deleted: {type: Seq.BOOLEAN, defaultValue: false}
});
var Book = seq.define('book', {
    code: Seq.STRING,
    name: Seq.STRING,
    author: Seq.STRING,
    translator: Seq.STRING,
    publisher: Seq.STRING,
    date: Seq.DATE,
    price: Seq.DECIMAL(18, 2),
    status: Seq.ENUM('IN', 'OUT', 'MISSED'),
    deleted: {type: Seq.BOOLEAN, defaultValue: false}
});
var Record = seq.define('record', {
    code: Seq.STRING,
    borrow_date: Seq.DATE,
    deadline: Seq.DATE,
    return_date: Seq.DATE,
    return_status: Seq.ENUM('BORROWED', 'RETURNED', 'MISSED', 'OVERDUE'),
    deleted: {type: Seq.BOOLEAN, defaultValue: false}
});

User.hasMany(Record);
Record.belongsTo(User);
Book.hasMany(Record);
Record.belongsTo(Book);

const CONST_USER_ROLE = {
        SUPER: 'SUPER',
        ADMIN: 'ADMIN',
        CUSTOM: 'CUSTOM'
    },
    CONST_BOOK_STATUS = {
        IN: 'IN',
        OUT: 'OUT',
        MISSED: 'MISSED'
    },
    CONST_RECORD_STATUS = {
        BORROWED: 'BORROWED',
        RETURNED: 'RETURNED',
        MISSED: 'MISSED',
    }

module.exports = {
    User: User,
    Book: Book,
    Record: Record,
    seq: seq,
    Seq: Seq,
    CONST_USER_ROLE:CONST_USER_ROLE,
    CONST_BOOK_STATUS:CONST_BOOK_STATUS,
    CONST_RECORD_STATUS:CONST_RECORD_STATUS
}