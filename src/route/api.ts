import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { Application, Request, Response } from "express";
import * as session from "express-session";
import * as fs from "fs";
import * as nunjucks from "nunjucks";
import * as path from "path";
import * as shortid from "shortid";
import { Config, Receipt as ClientReceipt, ClientResponse, User as ClientUser, IRouteClient } from "./types";
import { IReceiptClient, Receipt, User } from "../receipt/types";
import { IFacebookClient } from "../user/facebook/types";
import { ILogger } from "../util/logger/types";
import { Json } from "../util/types";


export class RouteClient extends IRouteClient {

    private readonly config: Config;

    private readonly logger: ILogger;

    private readonly app: Application;

    private readonly facebookClient: IFacebookClient;
    
    private readonly receiptClient: IReceiptClient;

    constructor (logger: ILogger, facebookClient: IFacebookClient, receiptClient: IReceiptClient) {
        super();
        
        try {
            this.config = Json.Parse<Config>(
                fs.readFileSync(path.join(__dirname, 'config.json'), { encoding: 'utf8' }), 
                Config.Is);
        } catch (err) {
            throw new TypeError("Unable to load config.json for RouteClient");
        }

        this.app = express();
        this.logger = logger;
        this.facebookClient = facebookClient;
        this.receiptClient = receiptClient;
        this.configure();
        this.route();
        this.api();
    }

    public listen(): void {
        this.app.listen(this.config.port, () => {
            this.logger.log(`Server running on port ${this.config.port}`);
        });
    }

    protected index (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                let user = User.FromFacebookUser(fbUser);
                this.receiptClient.all(user)
                    .then(receipts => res.render('index.html', ClientResponse.FromData(user, receipts.map(ClientReceipt.FromServerReceipt))))
                    .catch(() => res.render('index.html', new Error("Unable to get receipts for user")));
            })
            .catch(() => res.render('index.html'));
    }

    protected login (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => res.redirect('/'))
            .catch(() => this.facebookClient.authorize(res));
    }

    protected logout (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(() => this.facebookClient.unauthorize(req))
            .catch(() => res.redirect('/'))
            .then(() => res.redirect('/'));
    }

    protected settings (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => res.render('settings.html', ClientResponse.FromData(User.FromFacebookUser(fbUser))))
            .catch(() => res.redirect('/'));
    }

    protected authorization (req: Request, res: Response): void {
        this.facebookClient.getAccessToken(req, res)
            .then(() => res.redirect('/'))
            .catch(() => res.redirect('/'));
    }

    protected add (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                ClientReceipt.TryParse(req.body)
                    .then(r => {
                        r.id = r.id || shortid.generate();
                        this.receiptClient.add(User.FromFacebookUser(fbUser), Receipt.FromClientReceipt(r))
                            .then(() => res.status(201).send(r))
                            .catch(() => res.status(500).send());
                    })
                    .catch(() => res.status(400).send());
            })
            .catch(() => res.status(401).send());
    }

    protected all (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                this.receiptClient.all(User.FromFacebookUser(fbUser))
                    .then(receipts => {
                        return (receipts.length > 0)
                            ? res.status(200).send(receipts.map(ClientReceipt.FromServerReceipt))
                            : res.status(404).send();
                    })
                    .catch(() => res.status(500).send());
            })
            .catch(() => res.status(401).send());
    }

    protected get (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                this.receiptClient.get(User.FromFacebookUser(fbUser), req.params.id)
                    .then(receipt => res.status(200).send(receipt))
                    .catch(() => res.status(404).send());
            })
            .catch(() => res.status(401).send());
    }

    protected edit (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                ClientReceipt.TryParse(req.body)
                    .then(r => {
                        this.receiptClient.edit(User.FromFacebookUser(fbUser), Receipt.FromClientReceipt(r))
                            .then(() => res.status(200).send(r))
                            .catch(() => res.status(500).send());
                    })
                    .catch(() => res.status(400).send());
            })
            .catch(() => res.status(401).send());
    }

    protected remove (req: Request, res: Response): void {
        this.facebookClient.getUser(req)
            .then(fbUser => {
                this.receiptClient.remove(User.FromFacebookUser(fbUser), req.params.id)
                    .then(() => res.status(204).send())
                    .catch(() => res.status(404).send());
            })
            .catch(() => res.status(401).send());
    }

    private configure(): void {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(session({ resave: true, saveUninitialized: true, secret: shortid.generate() }));
        this.app.use('/public', express.static('dist/public/'));
        nunjucks.configure(['dist/public/views'], {
            autoescape: true,
            express: this.app
        });
    }

    private route(): void {
        this.app.get('/', this.logged(this.index.bind(this)));
        this.app.get('/login', this.logged(this.login.bind(this)));
        this.app.get('/logout', this.logged(this.logout.bind(this)));
        this.app.get('/settings', this.logged(this.settings.bind(this)));
        this.app.get('/login/facebook', this.logged(this.authorization.bind(this)));
        this.facebookClient.setRedirect(`http://localhost:${this.config.port}/login/facebook`);
    }

    private api(): void {
        this.app.post('/api/v1/receipts', this.logged(this.add.bind(this)));
        this.app.get('/api/v1/receipts', this.logged(this.all.bind(this)));
        this.app.get('/api/v1/receipts/:id', this.logged(this.get.bind(this)));
        this.app.put('/api/v1/receipts/:id', this.logged(this.edit.bind(this)));
        this.app.delete('/api/v1/receipts/:id', this.logged(this.remove.bind(this)));
    }

    private logged (route: (req: Request, res: Response) => void): (req: Request, res: Response) => void {
        return (req: Request, res: Response) => {
            this.logger.logRequest(req);
            route(req, res);
        };
    }

}