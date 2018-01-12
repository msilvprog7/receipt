var request = require('request'),
    shortid = require('shortid'),
    querystring = require('querystring'),
    logger = require('./logger.js');

const STATE_KEY = "facebook_state_key";

exports.redirectToLogin = function (app, req, res) {
    var state = shortid.generate();
    res.cookie(STATE_KEY, state);
    res.redirect(`https://www.facebook.com/${app.get('config').facebook.version}/dialog/oauth?` + querystring.stringify({
            client_id: app.get('config').facebook.appId,
            redirect_uri: `${app.get('route')}${app.get('config').facebook.redirect}`,
            state: state,
            scope: app.get('config').facebook.scope
        }));
};

exports.authenticate = function (app, req, res) {
    return new Promise((resolve, reject) => {
        var state = req.query.state,
            storedState = req.cookies[STATE_KEY];

        if (!state || !storedState || state !== storedState) {
            return reject();
        }

        res.clearCookie(STATE_KEY);

        var options = getGraphRequestOptions(app, req, '/oauth/access_token', {
            client_id: app.get('config').facebook.appId,
            redirect_uri: `${app.get('route')}${app.get('config').facebook.redirect}`,
            client_secret: app.get('config').facebook.appSecret,
            code: req.query.code
        });

        request(options, (err, graphRes, body) => {
                if (err || graphRes.statusCode !== 200) {
                    logger.logResponseError(err, graphRes);
                    return reject();
                }

                var data = JSON.parse(body);
                req.session.access_token = data.access_token;
                req.session.save(function (saveErr) {
                    if (saveErr) {
                        logger.log(`Unable to save access token: ${saveErr}`);
                        return reject();
                    }
                    console.log(data.access_token);
                    resolve();
                });
            });
    });
};

exports.logout = function (app, req, res) {
    return new Promise((resolve, reject) => {
        if (!req || !req.session) {
            return resolve();
        }

        req.session.destroy(function (err) {
            if (err) {
                logger.log(`Error destroying session: ${err}`);
                return reject();
            }

            resolve();
        });
    });
};

exports.getUser = function (app, req, res) {
    return new Promise((resolve, reject) => {
        if (!req || !req.session || !req.session.access_token) {
            return reject();
        }
        
        request(getGraphRequestOptions(app, req, '/me', { fields: "name,picture" }), (err, graphRes, body) => {
                if (err || graphRes.statusCode !== 200) {
                    logger.logResponseError(err, graphRes);
                    return reject();
                }
                
                var data = JSON.parse(body),
                    name = data.name || '',
                    picture = (data.picture && data.picture.data) ? data.picture.data : {},
                    id = data.id;
                
                resolve({
                    name: {
                        first: name.split(' ')[0],
                        last: name.split(' ').slice(-1)[0],
                        full: name
                    },
                    picture: {
                        url: picture.url
                    },
                    id: id,
                });
            });
    });
};

var getGraphRequestOptions = function (app, req, route, query) {
    return {
        url: `https://graph.facebook.com/${app.get('config').facebook.version}${route}${(query) ? '?' + querystring.stringify(query) : ''}`,
        headers: getHeaders(app, req)
    }
};

var getHeaders = function (app, req) {
    var headers = {};

    if (req && req.session && req.session.access_token) {
        headers["Authorization"] = `Bearer ${req.session.access_token}`;
    }

    return headers;
};
