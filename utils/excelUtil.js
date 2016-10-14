/**
 * Created by taotao on 2016/10/10.
 */
"use strict"
var xlsx = require('node-xlsx');
var fs = require('fs');
var util = require("util");

var book_fields = {
    '书名': 'name',
    '图书编号': 'code',
    '作者': 'author',
    '译者': 'translator',
    '出版社': 'publisher',
    '出版日期': 'date',
    '价格': 'price'
}
var user_fields = {
    '工号':'code',
    '姓名':'name',
    '性别':'gender',
    '出生日期':'birth',
    '借阅周期':'period',
    '角色':'role',
    '电话':'phone',
    '邮箱':'email',
    '密码':'password'
}

var date_fields = ['date','birth']
/**
 * Excel日期从为从1900,0,0起的天数值,将其转换为js时间
 * @param date
 */
const a_day = 1000*60*60*24;
const zero_date = new Date(1900,0,0);
function parseDate(date) {
    return util.isNumber(date)?new Date(a_day * (date - 1) + zero_date.getTime()):null;
}
/**
 * 解析excel数据
 * @param filePath 可以为文件路径,或者是buffer
 * @param fields 要解析的列名与数据库中对应的字段
 * @returns {*} 解析成功返回解析的list数组,否则返回失败信息
 */


function parseXlsx(filePath, fields) {
    var excel = xlsx.parse(filePath);
    if (excel && excel.length && excel[0] && excel[0]['data']) {  //只解析Xlsx文件的第一个sheet
        var field_index = {};
        var cols = excel[0]['data'][0];     //要求第一行为标题行,标题行要与配置的字段值一致,否则不予解析
        Object.keys(fields).forEach(function (key) {
            var index = cols.indexOf(key);
            field_index[fields[key]] = index;
        });
        if (Object.keys(field_index).length != Object.keys(fields).length) {
            return {
                flag: false,
                msg: 'Excel格式不符合要求,未能解析!'
            }
        }
        var list = [];
        var data = excel[0]['data'];
        data.shift();//剔除标题行,只保留数据
        if (data && data.length) {

            data.forEach(function (row) {
                var obj = {};
                Object.keys(field_index).forEach(function (key) {
                    var val = row[field_index[key]];
                    if(key==='gender'){
                        obj[key] = {'男':'M','女':'F'}[val];
                    }else{
                        obj[key] = date_fields.indexOf(key)>-1?parseDate(val):val;
                    }

                });
                list.push(obj);
            });
            return list;
        } else {
            return {
                flag: false,
                msg: '无数据!'
            }
        }
    }
}


/**
 * 将给定的数据生成Excel的Buffer
 * @param sheetName sheet页的名称
 * @param data 数据,二维数组类型
 * @returns {*}
 */
function generateXlsx(sheetName,data) {
    return xlsx.build([{name: sheetName, data: data}]); // Returns a buffer
}
module.exports = {
    parseBookList: function (excelStream) {
        return parseXlsx(excelStream, book_fields);
    },
    parseUseList:function (excelStream) {
        return parseXlsx(excelStream,user_fields);
    },
    generateXlsx:generateXlsx
}
