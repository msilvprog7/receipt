import { IReceiptClient, Receipt, TempUserStore, User } from "./types";
import { ILogger } from "../util/logger/types";
import { IdentifiableDictionary, TypeGuards, Identifiable } from "../util/types";


export class ReceiptClient extends IReceiptClient {

    private readonly logger: ILogger;
    private tempStore: TempUserStore;

    constructor (logger: ILogger, tempStore?: TempUserStore) {
        super();
        this.logger = logger;
        this.tempStore = tempStore || new TempUserStore();
    }

    public add (user: User, receipt: Receipt): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.tempStore.get(user.id) && !this.tempStore.add(user.id, new IdentifiableDictionary<Receipt>())) {
                return reject();
            }
    
            return (!this.tempStore.get(user.id).addIdentifiable(receipt))
                ? reject()
                : resolve();
        });
    }

    public all (user: User): Promise<Receipt[]> {
        return new Promise((resolve, reject) => {
            return (!this.tempStore.get(user.id))
                ? resolve([])
                : resolve(this.tempStore.get(user.id).values());
        });
    }

    public edit (user: User, receipt: Receipt): Promise<void> {
        return new Promise((resolve, reject) => {
            return (!this.tempStore.get(user.id) || !this.tempStore.get(user.id).editIdentifiable(receipt))
                ? reject()
                : resolve();
        });
    }

    public get (user: User, id: string): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            return (!this.tempStore.get(user.id) || !this.tempStore.get(user.id).get(id))
                ? reject()
                : resolve(this.tempStore.get(user.id).get(id));
        });
    }

    public remove (user: User, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            return (!this.tempStore.get(user.id) || !this.tempStore.get(user.id).remove(id))
                ? reject()
                : resolve();
        });
    }

}
