import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as session from "express-session";
import * as fs from "fs";
import * as nunjucks from "nunjucks";
import * as shortid from "shortid";
import * as facebook from "./facebook/api";
import * as receipt from "./receipt/api";
import { AddReceiptRequest, EditReceiptRequest, Receipt, Response, User } from "./receipt/types";
import * as logger from "./shared/logger";
import { TypeGuards } from "./shared/types";


/**
 * App Settings
 */
const app = express();
app.set('port', 8080);
app.set('route', `http://localhost:${app.get('port')}`);
app.set('config', JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8' })));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({ resave: true, saveUninitialized: true, secret: shortid.generate() }));

app.use('/public', express.static('dist/public/'));

nunjucks.configure(['dist/public/views'], {
    autoescape: true,
    express: app
});


/**
 * Routes
 */
app.get('/', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(fbUser => {
            let user = new User(fbUser);
            receipt.all(app, user)
                .then(receipts => res.render('index.html', new Response(user, receipts)))
                .catch(() => res.render('index.html', new Error("Unable to get receipts for user")));
        })
        .catch(() => res.render('index.html'));
});

app.get('/login', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(fbUser => res.redirect('/'))
        .catch(() => facebook.redirectToLogin(app, req, res));
});

app.get('/logout', (req, res) => {
    logger.logRequest(req);

    facebook.logout(app, req, res)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'));
});


app.get('/settings', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(fbUser => res.render('settings.html', new Response(new User(fbUser))))
        .catch(() => res.redirect('/'));
});

app.get(app.get('config').facebook.redirect, (req, res) => {
    logger.logRequest(req);

    facebook.authenticate(app, req, res)
        .then(() => res.redirect('/'))
        .catch(() => res.redirect('/'));
});


/**
 * API Routes
 */
app.post('/api/v1/receipts', (req, res) => {
    logger.logRequest(req);

    facebook.getUser(app, req, res)
        .then(fbUser => {
            AddReceiptRequest.TryParse(req.body, shortid.generate())
                .then(r => {
                    receipt.add(app, new User(fbUser), r)
                        .then(() => res.status(201).send(r))
                        .catch(() => res.status(500).send());
                })
                .catch(() => res.status(400).send());
        })
        .catch(() => res.status(401).send());
});

app.get('/api/v1/receipts', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(fbUser => {
            receipt.all(app, new User(fbUser))
                .then(receipts => {
                    return (receipts.length > 0)
                        ? res.status(200).send(receipts)
                        : res.status(404).send();
                })
                .catch(() => res.status(500).send());
        })
        .catch(() => res.status(401).send());
});

app.get('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(fbUser => {
            receipt.get(app, new User(fbUser), req.params.id)
                .then(receipt => res.status(200).send(receipt))
                .catch(() => res.status(404).send());
        })
        .catch(() => res.status(401).send());
});

app.put('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(fbUser => {
            EditReceiptRequest.TryParse(req.body)
                .then(r => {
                    receipt.edit(app, new User(fbUser), r)
                        .then(() => res.status(200).send(r))
                        .catch(() => res.status(500).send());
                })
                .catch(() => res.status(400).send());
        })
        .catch(() => res.status(401).send());
});

app.delete('/api/v1/receipts/:id', (req, res) => {
    logger.logRequest(req);
    
    facebook.getUser(app, req, res)
        .then(fbUser => {
            receipt.remove(app, new User(fbUser), req.params.id)
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
