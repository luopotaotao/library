/**
 * Created by taotao on 2016/10/10.
 */
function setXlsxResponseHeaders(res,filename) {
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    try {
        res.set('Content-Disposition', 'attachment;filename=' + filename);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    setXlsxResponseHeaders:setXlsxResponseHeaders
}