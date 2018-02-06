import * as $ from "jquery";
import { IReceiptClient } from "./types";
import { Receipt } from "../../../route/types";
import { ILogger } from "../../../util/logger/types";


export class ReceiptClient extends IReceiptClient {

    private readonly logger: ILogger;

    constructor (logger: ILogger) {
        super();
        this.logger = logger;
    }

    public add (receipt: Receipt): Promise<Receipt> {
        return new Promise((resolve, reject) => {
            $.ajax({
                method: "POST",
                url: "http://localhost:8080/api/v1/receipts", 
                data: JSON.stringify(receipt), 
                dataType: "json",
                contentType: "application/json",
                success: function (data, textStatus, jqXHR) {
                    switch (jqXHR.status) {
                        case 201:
                            return (!Receipt.Is(data))
                                ? reject()
                                : resolve(data);
        
                        default:
                            return reject(jqXHR.status);
                    }
                }
            });
        });
    }

    public remove (id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            $.ajax({
                method: "DELETE",
                url: `http://localhost:8080/api/v1/receipts/${id}`,
                success: function (data, textStatus, jqXHR) {
                    switch (jqXHR.status) {
                        case 204:
                            return resolve(true);
        
                        default:
                            return reject(jqXHR.status);
                    }
                }
            })
        });
    }

}
