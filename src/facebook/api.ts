import { Application, Request, Response } from "express";
import * as querystring from "querystring";
import * as request from "request";
import * as shortid from "shortid";
import { AuthResponse, User } from "./types";
import * as logger from "../shared/logger";
import { Index, Json, TypeGuards } from "../shared/types";
import { configure } from "nunjucks";

const STATE_KEY = 'facebook_state_key';


export let authenticate = (app: Application, req: Request, res: Response): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!TypeGuards.IsObject(req.query) || !TypeGuards.IsString(req.query.state) || 
            !TypeGuards.IsObject(req.cookies) || !TypeGuards.IsString(req.cookies[STATE_KEY]) || 
            req.query.state !== req.cookies[STATE_KEY]) {
            return reject();
        }

        res.clearCookie(STATE_KEY);

        let options = getGraphRequestOptions(app, req, '/oauth/access_token', {
            client_id: app.get('config').facebook.appId,
            redirect_uri: `${app.get('route')}${app.get('config').facebook.redirect}`,
            client_secret: app.get('config').facebook.appSecret,
            code: req.query.code
        });

        request(options, (err, graphRes, body) => {
                if (TypeGuards.IsObject(err) || graphRes.statusCode !== 200) {
                    logger.logResponseError(err, graphRes);
                    return reject();
                }

                Json.TryParse<AuthResponse>(body, AuthResponse.Is)
                    .then(auth => {
                        req.session.access_token = auth.access_token;
                        req.session.save((saveErr) => {
                            if (TypeGuards.IsObject(saveErr)) {
                                logger.log(`Unable to save access token: ${saveErr}`);
                                return reject();
                            }
                            
                            resolve();
                        });
                    })
                    .catch(() => reject());
            });
    });
};

export let getUser = (app: Application, req: Request, res: Response): Promise<User> => {
    return new Promise((resolve, reject) => {
        if (!TypeGuards.IsObject(req.session) || !TypeGuards.IsString(req.session.access_token)) {
            return reject();
        }
        
        request(getGraphRequestOptions(app, req, '/me', { 'fields': 'name,picture' }), (err, graphRes, body) => {
                if (TypeGuards.IsObject(err) || graphRes.statusCode !== 200) {
                    logger.logResponseError(err, graphRes);
                    return reject();
                }

                Json.TryParse<User>(body, User.Is)
                    .then(user => resolve(user))
                    .catch(() => reject());
            });
    });
};

let getRequestHeaders = (app: Application, req: Request): request.Headers => {
    return {
        'Authorization': `Bearer ${req.session.access_token}`
    };
};

let getGraphRequestOptions = (app: Application, req: Request, route: string, query: Index<string>): request.OptionsWithUrl => {
    return {
        url: `https://graph.facebook.com/${app.get('config').facebook.version}${route}` +
             `${(query) ? '?' + querystring.stringify(query) : ''}`,
        headers: getRequestHeaders(app, req)
    };
};

export let logout = (app: Application, req: Request, res: Response): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!TypeGuards.IsObject(req.session)) {
            return resolve();
        }

        req.session.destroy((err) => {
            if (TypeGuards.IsObject(err)) {
                logger.log(`Error destroying session: ${err}`);
                return reject();
            }

            resolve();
        });
    });
};

export let redirectToLogin = (app: Application, req: Request, res: Response): void => {
    let state = shortid.generate();
    res.cookie(STATE_KEY, state);
    res.redirect(`https://www.facebook.com/${app.get('config').facebook.version}/dialog/oauth?` + querystring.stringify({
            client_id: app.get('config').facebook.appId,
            redirect_uri: `${app.get('route')}${app.get('config').facebook.redirect}`,
            state: state,
            scope: app.get('config').facebook.scope
        }));
};
