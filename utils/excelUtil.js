/**
 * Created by taotao on 2016/10/10.
 */
"use strict"
var xlsx = require('node-xlsx');
var fs = require('fs');

var fields = {
    '书名': 'name',
    '图书编号': 'code',
    '作者': 'author',
    '译者': 'translator',
    '出版社': 'publisher',
    '出版日期': 'date',
    '价格': 'price'
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
                    obj[key] = row[field_index[key]]
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
        return parseXlsx(excelStream, fields);
    },
    generateXlsx:generateXlsx
}
