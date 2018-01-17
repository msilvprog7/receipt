var shortid = require('shortid'),
    tempStore = {};

exports.create = function (app, user, receipt) {
    return new Promise((resolve, reject) => {
        receipt.id = shortid.generate();
        tempStore[user.id] = tempStore[user.id] || {};
        tempStore[user.id][receipt.id] = receipt;
        resolve();
    });
};

exports.get = function (app, user, id) {
    return new Promise((resolve, reject) => {
        if (id && tempStore[user.id] && tempStore[user.id][id]) {
            return resolve(tempStore[user.id][id]);
        } else if (id) {
            return reject();
        }

        if (tempStore[user.id]) {
            return resolve(Object.keys(tempStore[user.id]).map(key => tempStore[user.id][key]));
        } else {
            return resolve([]);
        }
    });
};

exports.update = function (app, user, id, receipt) {
    return new Promise((resolve, reject) => {
        exports.get(app, user, id)
            .then(r => {
                tempStore[user.id][id] = receipt;
                resolve();
            })
            .catch(() => reject());
    });
};

exports.delete = function (app, user, id) {
    return new Promise((resolve, reject) => {
        exports.get(app, user, id)
            .then(r => {
                delete tempStore[user.id][id];
                resolve();
            })
            .catch(() => reject());
    });
};
