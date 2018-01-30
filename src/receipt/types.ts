import { User as FacebookUser } from "../facebook/types";
import { Dictionary, FormattedDateTime, FormattedName, Identifiable, IdentifiableDictionary, Picture, TypeGuards } from "../shared/types";


export interface AddReceiptRequest {
    transaction: string,
    amount: number,
    date: string,
    category: string
}

export class AddReceiptRequest {
    public static TryParse (req: any, id: string): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            if (!AddReceiptRequest.Is(req)) {
                return reject();
            }
            
            resolve({
                id: id,
                transaction: req.transaction,
                amount: req.amount,
                date: req.date,
                category: req.category
            });
        });
    }

    public static Is (req: any): req is AddReceiptRequest {
        return TypeGuards.IsObject(req) &&
               TypeGuards.IsString(req.transaction) && 
               TypeGuards.IsNumber(req.amount) &&
               TypeGuards.IsStringDate(req.date) &&
               TypeGuards.IsString(req.category);
    }
}

export interface EditReceiptRequest extends Identifiable {
    transaction: string,
    amount: number,
    date: string,
    category: string
}

export class EditReceiptRequest {
    public static TryParse (req: any): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            if (!EditReceiptRequest.Is(req)) {
                return reject();
            }
            
            resolve({
                id: req.id,
                transaction: req.transaction,
                amount: req.amount,
                date: req.date,
                category: req.category
            });
        });
    }

    public static Is (req: any): req is EditReceiptRequest {
        return TypeGuards.IsObject(req) &&
               TypeGuards.IsString(req.id) &&
               TypeGuards.IsString(req.transaction) && 
               TypeGuards.IsNumber(req.amount) &&
               TypeGuards.IsStringDate(req.date) &&
               TypeGuards.IsString(req.category);
    }
}

export interface Error {
    message: string;
}

export class Error {
    constructor (msg: string) {
        this.message = msg;
    }
}

export interface Receipt extends Identifiable {
    transaction: string,
    amount: number,
    date: string,
    category: string
}

export class Receipt {
    public static Is (receipt: any): receipt is Receipt {
        return TypeGuards.IsObject(receipt) &&
               TypeGuards.IsString(receipt.id) &&
               TypeGuards.IsString(receipt.transaction) &&
               TypeGuards.IsNumber(receipt.amount) &&
               TypeGuards.IsStringDate(receipt.date) &&
               TypeGuards.IsString(receipt.category);
    }
}

export interface Response {
    user: User,
    receipts?: Receipt[],
    date: FormattedDateTime
}

export class Response {
    constructor (user: User, receipts?: Receipt[]) {
        this.user = user;
        this.receipts = receipts;
        this.date = new FormattedDateTime(new Date())
    }
}

export class TempUserStore extends Dictionary<IdentifiableDictionary<Receipt>> {
    constructor () {
        super();
    }
}

export interface User extends Identifiable {
    name: FormattedName,
    picture: Picture
}

export class User {
    constructor (user: FacebookUser) {
        this.name = {
            first: user.name.split(' ')[0],
            last: user.name.split(' ').slice(-1)[0],
            full: user.name
        };
        this.picture = {
            url: user.picture.data.url,
            width: user.picture.data.width,
            height: user.picture.data.height
        };
    }

    public static Is (user: any): user is User {
        return TypeGuards.IsObject(user) &&
               TypeGuards.IsString(user.id) &&
               FormattedName.Is(user.name) &&
               Picture.Is(user.picture);
    }
}
