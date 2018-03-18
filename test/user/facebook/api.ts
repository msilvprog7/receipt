import * as chai from "chai";
import { Request } from "express";
import * as fs from "fs";
import * as mocha from "mocha";
import * as request from "request";
import * as shortid from "shortid";
import { SinonStub, spy, stub }  from "sinon";
import { FacebookClient } from "../../../src/user/facebook/api";
import { Config, IFacebookClient, User } from "../../../src/user/facebook/types";
import { ILogger } from "../../../src/util/logger/types";


interface Context {
    logger: ILogger,
    config: Config | any,
    readFileSyncStub: SinonStub,
    request: Request | any,
    requestGetStub: SinonStub,
    requestGetError: string | any,
    requestGetResponse: request.RequestResponse | any,
    requestGetBody: any 
}

class Context {

    constructor (logger: ILogger, config: Config, request: Request | any) {
        this.logger = logger;
        this.config = config;
        this.request = request;
    }

    public static Default (): Context {
        let logger: ILogger = {
            log: (msg: string) => stub(),
            logRequest: (req: Request) => stub(),
            logResponse: (res: request.RequestResponse) => stub()
        };

        let config: Config = {
            client_id: "client-id",
            client_secret: "client-secret",
            version: "v1.0",
            scope: "read-user,read-user-pic"
        };

        let request = {
            session: {
                auth: {
                    access_token: "some-token"
                }
            }
        };

        return new Context(logger, config, request);
    }

    public static InvalidConfig (): Context {
        let context = Context.Default();
        context.config = { client_id: "client-id-without-other-fields" };
        return context;
    }

    public static InvalidSessionData (): Context {
        let context = Context.Default();
        context.request = {
            session: {
                not_auth: "value"
            }
        };
        return context;
    }

    public setup (): void {
        this.readFileSyncStub = stub(fs, 'readFileSync').returns(JSON.stringify(this.config));
        this.requestGetStub = stub(request, 'get').yields(this.requestGetError, this.requestGetResponse, this.requestGetBody);
    }

    public getUser(): Promise<User> {
        return new FacebookClient(this.logger).getUser(this.request as Request);
    }

    public cleanup (): void {
        this.readFileSyncStub.restore();
        this.requestGetStub.restore();
    }

}

describe('FacebookClient', () => {

    let context: Context;

    before(() => {
        chai.should();
    });

    afterEach(() => {
        context.cleanup();
    });

    describe('#constructor()', () => {
        it('should throw if invalid config', () => {
            context = Context.InvalidConfig();
            context.setup();

            (() => new FacebookClient(context.logger)).should.throw();
        });

        it('should not throw if valid config', () => {
            context = Context.Default();
            context.setup();

            (() => new FacebookClient(context.logger)).should.not.throw();
        });
    });

    describe('#getUser()', () => {
        it('should reject with invalid session data', done => {
            context = Context.InvalidSessionData();
            context.setup();

            context.getUser()
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                })
        });

        it('should reject on error', done => {
            context = Context.Default();
            context.requestGetError = "Failed to get user!";
            context.requestGetResponse = { statusCode: 500 };
            context.requestGetBody = null;
            context.setup();

            context.getUser()
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it('should reject on unexpected response', done => {
            context = Context.Default();
            context.requestGetError = null;
            context.requestGetResponse = { statusCode: 200 };
            context.requestGetBody = { some: "1", other: ["type", "of", "response"] };
            context.setup();

            context.getUser()
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it('should resolve with user on success', done => {
            context = Context.Default();
            context.requestGetError = null;
            context.requestGetResponse = { statusCode: 200 };
            let user: User = {
                id: "12345",
                name: "User McUser",
                picture: {
                    data: {
                        url: "http://localhost/img.png",
                        width: 50,
                        height: 50
                    }
                }
            };
            context.requestGetBody = JSON.stringify(user);
            context.setup();

            context.getUser()
                .then(u => {
                    u.id.should.equal(user.id);
                    u.name.should.equal(user.name);
                    u.picture.data.url.should.equal(user.picture.data.url);
                    u.picture.data.width.should.equal(user.picture.data.width);
                    u.picture.data.height.should.equal(user.picture.data.height);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });
    });

});
