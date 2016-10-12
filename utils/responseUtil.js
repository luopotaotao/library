/**
 * Created by taotao on 2016/10/10.
 */
function setXlsxResponseHeaders(res) {
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition','attachment;filename=logo.xlsx');
}

module.exports = {
    setXlsxResponseHeaders:setXlsxResponseHeaders
}