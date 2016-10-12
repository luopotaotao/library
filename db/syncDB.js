/**
 * Created by taotao on 2016/10/8.
 */
'use strict'
var models = require('./libraryModels');

//
for(let key of Object.keys(models)){
    if(models[key] instanceof models.Seq.Model){
        models[key].sync({force:true});
    }
}

