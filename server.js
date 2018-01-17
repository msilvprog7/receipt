var express = require('express'),
    session = require('express-session'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    nunjucks = require('nunjucks'),
    shortid = require('shortid'),
    fs = require('fs'),
    facebook = require('./server/facebook.js'),
    logger = require('./server/logger.js'),
    receiptsApi = require('./server/receipts.js');


/**
 * App Settings
 */
var app = express();
app.set('port', 8080);
app.set('route', `http://localhost:${app.get('port')}`);
app.set('config', JSON.parse(fs.readFileSync('./config.json', { encoding: "utf8" })));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
 * API Routes
 */
app.post('/api/v1/receipts', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(user => {
            receiptsApi.create(app, user, req.body)
                .then(() => res.status(201).send())
                .catch(() => res.status(400).send());
        })
        .catch(() => res.status(401).send());
});

app.get('/api/v1/receipts', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(user => {
            receiptsApi.get(app, user)
                .then(receipts => {
                    if (receipts && receipts.length > 0) {
                        res.status(200).send(receipts);
                    } else {
                        res.status(404).send();
                    }
                })
                .catch(() => res.status(400).send());
        })
        .catch(() => res.status(401).send());
});

app.get('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(user => {
            receiptsApi.get(app, user, req.params.id)
                .then(receipt => res.status(200).send(receipt))
                .catch(() => res.status(404).send());
        })
        .catch(() => res.status(401).send());
});

app.put('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(user => {
            receiptsApi.update(app, user, req.params.id, req.body)
                .then(() => res.status(204).send())
                .catch(() => res.status(404).send());
        })
        .catch(() => res.status(401).send());
});

app.delete('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(user => {
            receiptsApi.delete(app, user, req.params.id)
                .then(() => res.status(204).send())
                .catch(() => res.status(404).send());
        })
        .catch(() => res.status(401).send());
});


/**
 * Start Server
 */
app.listen(app.get('port'), () => {
    logger.log(`Server running on port ${app.get('port')}`);
});
