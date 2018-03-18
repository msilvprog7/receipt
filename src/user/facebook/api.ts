import { Request } from "express";
import * as fs from "fs";
import * as path from "path";
import * as request from "request";
import { Config, IFacebookClient, User } from "./types";
import { AccessTokenRequest, AuthorizationRequest } from "../types";
import { ILogger } from "../../util/logger/types";
import { Json, TypeGuards } from "../../util/types";


export class FacebookClient extends IFacebookClient {

    protected readonly config: Config;

    protected readonly logger: ILogger; 

    protected readonly authorizationRequest: AuthorizationRequest;

    protected readonly accessTokenRequest: AccessTokenRequest;

    constructor (logger: ILogger) {
        super();
        
        try {
            this.config = Json.Parse<Config>(
                fs.readFileSync(path.join(__dirname, 'config.json'), { encoding: 'utf8' }), 
                Config.Is);
        } catch (err) {
            throw new TypeError("Unable to load config.json for FacebookClient");
        }

        this.logger = logger;
        this.authorizationRequest = {
            uri: `https://www.facebook.com/${this.config.version}/dialog/oauth`,
            client_id: this.config.client_id,
            redirect_uri: "",
            scope: this.config.scope
        };
        this.accessTokenRequest = {
            uri: `https://graph.facebook.com/${this.config.version}/oauth/access_token`,
            client_id: this.config.client_id,
            redirect_uri: "",
            client_secret: this.config.client_secret
        };
    }

    public getUser (req: Request): Promise<User> {
        return new Promise((resolve, reject) => {
            if (!TypeGuards.IsObject(req.session) || !TypeGuards.IsObject(req.session.auth)) {
                return reject();
            }

            request.get(
                `https://graph.facebook.com/${this.config.version}/me?fields=name,picture`, 
                { headers: this.applyAuthorizationHeader(req) }, 
                (err, res, body) => {
                    if (TypeGuards.IsString(err) || res.statusCode !== 200) {
                        this.logger.logResponse(res, err);
                        return reject();
                    }

                    Json.TryParse<User>(body, User.Is)
                        .then(user => resolve(user))
                        .catch(() => reject());
                });
        });
    }

}
