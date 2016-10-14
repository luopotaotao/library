/**
 * Created by taotao on 2016/10/14.
 */
"use strict";
var util = require("util");
var db = require('../../db/libraryModels');
var Sequelize = db.Seq;
var sequelize = db.seq;

var Tasks = sequelize.define('task', {
    name: {
        type: Sequelize.STRING,
        validate: {
            notNull: { args: true, msg: 'name cannot be null' }
        }
    },
    code: {
        type: Sequelize.STRING,
        validate: {
            len: [3, 10]
        }
    }
})
// Tasks.sync({force:true});
Tasks.bulkCreate([
    {name: 'foo', code: '123'},
    {code: '1234'},
    {name: 'bar', code: '1'}
], { validate: false }).then(function (result) {
    console.log(result.length);
}).catch(function(errors) {
    console.log(errors);
    /* console.log(errors) would look like:
     [
     { record:
     ...
     errors:
     { name: 'SequelizeValidationError',
     message: 'Validation error',
     errors: [Object] } },
     { record:
     ...
     errors:
     { name: 'SequelizeValidationError',
     message: 'Validation error',
     errors: [Object] } }
     ]
     */
}).all(function (e) {
    console.log('done');
})