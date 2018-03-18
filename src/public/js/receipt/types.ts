import { Receipt } from "../../../route/types";


export abstract class IReceiptClient {

    public abstract add (receipt: Receipt): Promise<Receipt>;

    public abstract remove (id: string): Promise<boolean>;

}
