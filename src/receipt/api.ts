import { IReceiptClient, Receipt, TempUserStore, User } from "./types";
import { ILogger } from "../util/logger/types";
import { IdentifiableDictionary, TypeGuards, Identifiable } from "../util/types";

const tempStore: TempUserStore = new TempUserStore();


export class ReceiptClient extends IReceiptClient {

    private readonly logger: ILogger;

    constructor (logger: ILogger) {
        super();
        this.logger = logger;
    }

    public add (user: User, receipt: Receipt): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!tempStore.get(user.id) && !tempStore.add(user.id, new IdentifiableDictionary<Receipt>())) {
                return reject();
            }
    
            return (!tempStore.get(user.id).addIdentifiable(receipt))
                ? reject()
                : resolve();
        });
    }

    public all (user: User): Promise<Receipt[]> {
        return new Promise((resolve, reject) => {
            return (!tempStore.get(user.id))
                ? resolve([])
                : resolve(tempStore.get(user.id).values());
        });
    }

    public edit (user: User, receipt: Receipt): Promise<void> {
        return new Promise((resolve, reject) => {
            return (!tempStore.get(user.id) || !tempStore.get(user.id).editIdentifiable(receipt))
                ? reject()
                : resolve();
        });
    }

    public get (user: User, id: string): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            return (!tempStore.get(user.id) || !tempStore.get(user.id).get(id))
                ? reject()
                : resolve(tempStore.get(user.id).get(id));
        });
    }

    public remove (user: User, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            return (!tempStore.get(user.id) || !tempStore.get(user.id).remove(id))
                ? reject()
                : resolve();
        });
    }

}
