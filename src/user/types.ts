import { Application, Request, Response } from "express";
import * as querystring from "querystring";
import * as request from "request";
import * as shortid from "shortid";
import { ILogger } from "../util/logger/types";
import { Index, Json, TypeGuards } from "../util/types";


export interface AccessToken {
    access_token: string
}

export class AccessToken {

    public static Is (res: any): res is AccessToken {
        return TypeGuards.IsObject(res) &&
               TypeGuards.IsString(res.access_token);
    }

}

export interface AccessTokenRequest {
    uri: string,
    client_id: string,
    client_secret: string,
    redirect_uri: string
}

export class AccessTokenRequest {

    public static GetQueryString (req: AccessTokenRequest, code: string): string {
        return querystring.stringify({
            client_id: req.client_id,
            client_secret: req.client_secret,
            code: code,
            redirect_uri: req.redirect_uri
        });
    }

    public static Is (req: any): req is AccessTokenRequest {
        return TypeGuards.IsObject(req) &&
               TypeGuards.IsString(req.uri) &&
               TypeGuards.IsString(req.client_id) &&
               TypeGuards.IsString(req.client_secret) &&
               TypeGuards.IsString(req.redirect_uri);
    }

}

export interface AuthorizationRequest {
    uri: string,
    client_id: string,
    redirect_uri: string,
    scope: string
}

export class AuthorizationRequest {

    public static GetQueryString (req: AuthorizationRequest, state: string): string {
        return querystring.stringify({
            client_id: req.client_id,
            redirect_uri: req.redirect_uri,
            state: state,
            scope: req.scope
        });
    }

    public static Is (req: any): req is AuthorizationRequest {
        return TypeGuards.IsObject(req) &&
               TypeGuards.IsString(req.uri) &&
               TypeGuards.IsString(req.client_id) &&
               TypeGuards.IsString(req.redirect_uri) &&
               TypeGuards.IsString(req.scope);
    }

}

export abstract class OAuth2Client {

    private static readonly STATE_KEY: string = "state_key";

    protected abstract readonly logger: ILogger;

    protected abstract readonly authorizationRequest: AuthorizationRequest;

    protected abstract readonly accessTokenRequest: AccessTokenRequest;
    
    public applyAuthorizationHeader(req: Request, headers?: Index<string>): Index<string> {
        headers = headers || {};

        if (TypeGuards.IsObject(req.session) && AccessToken.Is(req.session.auth)) {
            headers["Authorization"] = `Bearer ${req.session.auth.access_token}`;
        }

        return headers;
    }

    public authorize(res: Response): void {
        let state = shortid.generate();
        res.cookie(OAuth2Client.STATE_KEY, state);
        res.redirect(
            `${this.authorizationRequest.uri}?` + 
            `${AuthorizationRequest.GetQueryString(this.authorizationRequest, state)}`);
    }

    public getAccessToken(req: Request, res: Response): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!TypeGuards.IsObject(req.query) || !TypeGuards.IsString(req.query.state) || 
                !TypeGuards.IsObject(req.cookies) || !TypeGuards.IsString(req.cookies[OAuth2Client.STATE_KEY]) || 
                req.query.state !== req.cookies[OAuth2Client.STATE_KEY]) {
                return reject();
            }
                
            res.clearCookie(OAuth2Client.STATE_KEY);
            request.get(
                `${this.accessTokenRequest.uri}?` + 
                `${AccessTokenRequest.GetQueryString(this.accessTokenRequest, req.query.code)}`, 
                (err, accessTokenRes, body) => {
                    if (TypeGuards.IsString(err) || accessTokenRes.statusCode !== 200) {
                        this.logger.logResponse(accessTokenRes, err);
                        return reject();
                    }
                    
                    Json.TryParse<AccessToken>(body, AccessToken.Is)
                        .then(token => {
                            req.session.auth = token;
                            req.session.save((saveErr) => {
                                if (TypeGuards.IsObject(saveErr)) {
                                    this.logger.log(`Unable to save access token: ${saveErr}`);
                                    return reject();
                                }
                                
                                resolve();
                            });
                        })
                        .catch(() => reject());
                });
        });
    }

    public setRedirect(redirectUri: string): void {
        this.authorizationRequest.redirect_uri = redirectUri;
        this.accessTokenRequest.redirect_uri = redirectUri;
    }

    public unauthorize(req: Request): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!TypeGuards.IsObject(req.session)) {
                return resolve();
            }
            
            req.session.destroy((err) => {
                if (TypeGuards.IsObject(err)) {
                    this.logger.log(`Error destroying session: ${err}`);
                    return reject();
                }
    
                resolve();
            });
        });
    }

}
