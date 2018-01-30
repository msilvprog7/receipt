import { Request } from "express";
import { RequestResponse} from "request";


export let log = (message: string) => {
    console.log(`${new Date().toLocaleString()}\t${message}`);
};

export let logRequest = (req: Request) => {
    exports.log(`${req.method} ${req.originalUrl}`);
};

export let logResponseError = (err: any, res: RequestResponse) => {
    exports.log(`Status: ${res.statusCode} Message: ${err}`);
};
