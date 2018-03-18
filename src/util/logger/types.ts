import { Request } from "express";
import { RequestResponse } from "request";


export abstract class ILogger {

    public abstract log (msg: string): void;

    public abstract logRequest (req: Request): void;

    public abstract logResponse (res: RequestResponse, err?: string): void;

}
