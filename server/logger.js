exports.log = function (msg) {
    console.log(`${new Date().toLocaleString()}\t${msg}`);
};

exports.logRequest = function (req) {
    exports.log(`${req.method} ${req.originalUrl}`);
};

exports.logResponseError = function (err, res) {
    exports.log(`Status: ${(res && res.statusCode) ? res.statusCode : 500} Message: ${(err) ? err : ''}`);
};
