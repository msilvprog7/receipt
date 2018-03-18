import * as $ from "jquery";
import { ReceiptClient } from "./receipt/api";
import { UxClient } from "./ux/api";
import { Logger } from "../../util/logger/api";


$(document).ready(() => {
    let logger = new Logger();
    let uxClient = new UxClient(logger, new ReceiptClient(logger));
    $("button[id='addReceiptButton']").click(() => {
        uxClient.addReceipt();
    });
    $("button[id^='deleteReceiptButton#']").click(e => {
        uxClient.removeReceipt(e);
    });
});
