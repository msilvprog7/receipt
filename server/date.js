exports.get = function () {
    var d = new Date();

    return {
        date: d.toJSON().split('T')[0]
    };
};
