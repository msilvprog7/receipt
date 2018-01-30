import * as $ from "jquery";
import * as receipt from "./receipt/api";
import { AddReceiptRequest } from "../../receipt/types";
import * as logger from "../../shared/logger";
import { TypeGuards } from "../../shared/types";


let addReceipt = () => {
    let request: AddReceiptRequest = {
        amount: Number(`${$("#addReceiptDollar").val() as number}.${$("#addReceiptChange").val() as number}`),
        transaction: $("#addReceiptTransaction").val() as string,
        date: $("#addReceiptDate").val() as string,
        category: $("#addReceiptCategory").val() as string
    };

    receipt.add(request)
        .then(r => {
            logger.log(`Added Receipt ${JSON.stringify(r)}`);

            let receiptCard = $("<div>", { 
                id: `receipt#${r.id}`, 
                class: "card border-light"
            }).append($("<div>", { class: "card-header" })
                            .append($("<span>", { html: `${r.date} [${r.category}]` }))
                            .append($("<button>", { id: `deleteReceiptButton#${r.id}`, class: "btn btn-danger", html: "Delete"})
                                .on('click', deleteReceipt)))
              .append($("<div>", { class: "card-body" })
                            .append($("<h4>", { class: "card-title", html: r.transaction }))
                            .append($("<p>", { class: "card-text", html: r.amount })));

            $("div[id='receipts']").prepend(receiptCard);
            $("div[id='noReceipts']").hide();
        })
        .catch(status => logger.log(`${status}: Unable to Add Receipt`));
};

let deleteReceipt = (e: JQuery.Event<HTMLElement, null>) => {
    let id = e.toElement.id.split('#')[1].replace(/\\s+/g, '');

    receipt.remove(id)
        .then(() => {
            logger.log(`Deleted Receipt ${id}`);

            $(`div[id='receipt#${id}']`).remove();

            if ($("div[id^='receipt#']").length == 0) {
                logger.log("Show No Receipts Card");
                $("div[id='noReceipts']").removeClass('hidden');
                $("div[id='noReceipts']").show();
            }
        })
        .catch(status => logger.log(`${status}: Unabled to Delete Receipt ${id}`));
};

$(document).ready(() => {
    $("button[id='addReceiptButton']").click(addReceipt);
    $("button[id^='deleteReceiptButton#']").click(deleteReceipt);
});
