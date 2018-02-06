import { Application, Request } from "express";
import * as process from "process";
import { RequestResponse} from "request";
import { ILogger } from "./types";


export class Logger extends ILogger {
    
    public exit (code: number, msg: string): void {
        this.log(msg);
        this.log(`Exiting (${code})...`)
        process.exit(code);
    }

    public log (msg: string): void {
        console.log(`${new Date().toLocaleString()}\t${msg}`);
    }

    public logRequest (req: Request): void {
        this.log(`${req.method} ${req.originalUrl}`);
    }

    public logResponse (res: RequestResponse, err?: string): void {
        this.log(`Status: ${res.statusCode} Message: ${err}`);
    }

}
