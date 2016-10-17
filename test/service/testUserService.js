/**
 * Created by taotao on 2016/10/8.
 */

const crypto = require('crypto');

const secret = '';
const hash = crypto.createHash('sha1', secret);
    hash.update('mima123465')
    .digest('hex');
    hash.update('mima123465')
    .digest('hex');
    hash.update('mima123465')
    .digest('hex');
console.log(hash);

var UserService = require('../../service/UserService');

// UserService.add({name:'李四',code:123},function (user) {
//     console.log(user.id);
// });
// UserService.update({id:1,name:'李四...'},function (user) {
//     console.log(user.id,user.name);
// });
// UserService.remove(1,function (ret) {
//     console.log(ret);
// });
//
// UserService.query({name:'李四'},function (result) {
//     console.log(result);
// });
//
// UserService.findByUsernamePassword('')

