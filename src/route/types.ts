import { Request, Response } from "express";
import { Identifiable, TypeGuards } from "../util/types";


export interface ClientResponse {
    user: User,
    receipts?: Receipt[],
    date: DateTime
}

export class ClientResponse {

    constructor (user: User, receipts?: Receipt[]) {
        this.user = user;
        this.receipts = receipts;
        this.date = new DateTime(new Date())
    }

}

export interface Config {
    port: number
}

export class Config {

    public static Is (config: any): config is Config {
        return TypeGuards.IsObject(config) &&
               TypeGuards.IsNumber(config.port);
    }

}

export interface DateTime {
    date: string
}

export class DateTime {
    
    constructor (dt: Date) {
        this.date = dt.toJSON().split('T')[0]
    }

    public static Is (dt: any): dt is DateTime {
        // todo: could validate date format, but unused
        return TypeGuards.IsObject(dt) &&
               TypeGuards.IsString(dt.date);
    }

}

export abstract class IRouteClient {

    protected abstract index (req: Request, res: Response): void;

    protected abstract login (req: Request, res: Response): void;

    protected abstract logout (req: Request, res: Response): void;

    protected abstract settings (req: Request, res: Response): void;

    protected abstract authorization (req: Request, res: Response): void;

    protected abstract add (req: Request, res: Response): void;

    protected abstract all (req: Request, res: Response): void;

    protected abstract get (req: Request, res: Response): void;

    protected abstract edit (req: Request, res: Response): void;

    protected abstract remove (req: Request, res: Response): void;
    
}

export interface Name {
    first: string,
    last: string,
    full: string
}

export class Name {

    public static Is (name: any): name is Name {
        return TypeGuards.IsObject(name) &&
               TypeGuards.IsString(name.first) &&
               TypeGuards.IsString(name.last) &&
               TypeGuards.IsString(name.full);
    }

}

export interface Picture {
    url: string,
    width: number,
    height: number
}

export class Picture {

    public static Is (pic: any): pic is Picture {
        return TypeGuards.IsObject(pic) &&
               TypeGuards.IsString(pic.url) &&
               TypeGuards.IsNumber(pic.width) &&
               TypeGuards.IsNumber(pic.height);
    }

}

export interface Receipt {
    id?: string,
    transaction: string,
    amount: number,
    date: string,
    category: string
}

export class Receipt {

    public static TryParse (receipt: any): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            return (!Receipt.Is(receipt))
                ? reject()
                : resolve(receipt);
        });
    }

    public static Is (req: any): req is Receipt {
        return TypeGuards.IsObject(req) &&
               (!req.id || TypeGuards.IsString(req.id)) &&
               TypeGuards.IsString(req.transaction) && 
               TypeGuards.IsNumber(req.amount) &&
               TypeGuards.IsStringDate(req.date) &&
               TypeGuards.IsString(req.category);
    }

}

export interface User extends Identifiable {
    name: Name,
    picture: Picture
}

export class User {
    
    public static Is (user: any): user is User {
        return TypeGuards.IsObject(user) &&
               TypeGuards.IsString(user.id) &&
               Name.Is(user.name) &&
               Picture.Is(user.picture);
    }

}
