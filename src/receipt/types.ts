import { Receipt as ClientReceipt } from "../route/types";
import { User as FacebookUser } from "../user/facebook/types";
import { Dictionary, Identifiable, IdentifiableDictionary, TypeGuards } from "../util/types";


export abstract class IReceiptClient {

    public abstract add (user: User, receipt: Receipt): Promise<void>;

    public abstract all (user: User): Promise<Receipt[]>;

    public abstract edit (user: User, receipt: Receipt): Promise<void>;

    public abstract get (user: User, id: string): Promise<Receipt>;

    public abstract remove (user: User, id: string): Promise<void>;
    
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

export interface Receipt extends Identifiable {
    transaction: string,
    amount: number,
    date: Date,
    category: string
}

export class Receipt {

    public static FromClientReceipt (receipt: ClientReceipt): Receipt {
        return {
            id: receipt.id,
            transaction: receipt.transaction,
            amount: receipt.amount,
            date: new Date(receipt.date),
            category: receipt.category
        };
    }

    public static Is (receipt: any): receipt is Receipt {
        return TypeGuards.IsObject(receipt) &&
               TypeGuards.IsString(receipt.id) &&
               TypeGuards.IsString(receipt.transaction) &&
               TypeGuards.IsNumber(receipt.amount) &&
               TypeGuards.IsObject(receipt.date) &&
               TypeGuards.IsString(receipt.category);
    }

}

export class TempUserStore extends Dictionary<IdentifiableDictionary<Receipt>> {

    constructor () {
        super();
    }

}

export interface User extends Identifiable {
    name: Name,
    picture: Picture
}

export class User {

    public static FromFacebookUser (user: FacebookUser): User {
        return {
            id: user.id,
            name: {
                first: user.name.split(' ')[0],
                last: user.name.split(' ').slice(-1)[0],
                full: user.name
            },
            picture: {
                url: user.picture.data.url,
                width: user.picture.data.width,
                height: user.picture.data.height
            }
        };
    }

    public static Is (user: any): user is User {
        return TypeGuards.IsObject(user) &&
               TypeGuards.IsString(user.id) &&
               Name.Is(user.name) &&
               Picture.Is(user.picture);
    }

}
