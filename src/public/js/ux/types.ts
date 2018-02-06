import * as $ from "jquery";


export abstract class IUxClient {
    
    public abstract addReceipt (): void;

    public abstract removeReceipt (e: JQuery.Event<HTMLElement>): void;

}
