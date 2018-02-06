import * as $ from "jquery";
import { IUxClient } from "./types";
import { IReceiptClient } from "../receipt/types";
import { ILogger } from "../../../util/logger/types";


export class UxClient extends IUxClient {

    private readonly logger: ILogger;

    private readonly receiptClient: IReceiptClient;

    constructor (logger: ILogger, receiptClient: IReceiptClient) {
        super();
        this.logger = logger;
        this.receiptClient = receiptClient;
    }

    public addReceipt (): void {
        this.receiptClient.add({
            amount: Number(`${$("#addReceiptDollar").val() as number}.${$("#addReceiptChange").val() as number}`),
            transaction: `${$("#addReceiptTransaction").val()}`,
            date: `${$("#addReceiptDate").val()}`,
            category: `${$("#addReceiptCategory").val()}`
        }).then(r => {
                this.logger.log(`Added Receipt ${JSON.stringify(r)}`);
            
                let receiptCard = $("<div>", { 
                    id: `receipt#${r.id}`, 
                    class: "card border-light"
                }).append($("<div>", { class: "card-header" })
                                .append($("<span>", { html: `${r.date} [${r.category}]` }))
                                .append($("<button>", { id: `deleteReceiptButton#${r.id}`, class: "btn btn-danger", html: "Delete"})
                                    .on('click', e => {
                                        this.removeReceipt(e);
                                    })))
                  .append($("<div>", { class: "card-body" })
                                .append($("<h4>", { class: "card-title", html: r.transaction }))
                                .append($("<p>", { class: "card-text", html: r.amount })));
    
                $("div[id='receipts']").prepend(receiptCard);
                $("div[id='noReceipts']").hide();
            })
            .catch(status => this.logger.log(`${status}: Unable to Add Receipt`));
    }

    public removeReceipt (e: JQuery.Event<HTMLElement>): void {
        let id = e.toElement.id.split('#')[1].replace(/\\s+/g, '');
        this.receiptClient.remove(id)
            .then(() => {
                this.logger.log(`Deleted Receipt ${id}`);

                $(`div[id='receipt#${id}']`).remove();

                if ($("div[id^='receipt#']").length == 0) {
                    this.logger.log("Show No Receipts Card");
                    $("div[id='noReceipts']").removeClass('hidden');
                    $("div[id='noReceipts']").show();
                }
            })
            .catch(status => this.logger.log(`${status}: Unabled to Delete Receipt ${id}`));
    }

}
