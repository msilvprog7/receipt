var express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    nunjucks = require('nunjucks'),
    shortid = require('shortid'),
    fs = require('fs'),
    facebook = require('./server/facebook.js'),
    logger = require('./server/logger.js');


/**
 * App Settings
 */
var app = express();
app.set('port', 8080);
app.set('route', `http://localhost:${app.get('port')}`);
app.set('config', JSON.parse(fs.readFileSync('./config.json', { encoding: "utf8" })));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(session({ resave: true, saveUninitialized: true, secret: shortid.generate() }));

nunjucks.configure(['site'], {
    autoescape: true,
    express: app
});


/**
 * Routes
 */
app.get('/', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(user => res.render('index.html', { user: user }))
        .catch(() => res.render('index.html', { user: null }));
});

app.get('/settings', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(user => res.render('settings.html', { user: user }))
        .catch(() => res.redirect('/'));
});

app.get('/login', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(user => res.redirect('/'))
        .catch(() => facebook.redirectToLogin(app, req, res));
});

app.get(app.get('config').facebook.redirect, (req, res) => {
    logger.logRequest(req);

    facebook.authenticate(app, req, res)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'));
});

app.get('/logout', (req, res) => {
    logger.logRequest(req);

    facebook.logout(app, req, res)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'));
});


/**
 * Start Server
 */
app.listen(app.get('port'), () => {
    logger.log(`Server running on port ${app.get('port')}`);
});
