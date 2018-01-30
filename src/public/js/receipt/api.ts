import * as $ from "jquery";
import { AddReceiptRequest, EditReceiptRequest, Receipt } from "../../../receipt/types";
import * as logger from "../../../shared/logger";


export let add = (req: AddReceiptRequest): Promise<Receipt> => {
    return new Promise((resolve, reject) => {
        $.ajax({
            method: "POST",
            url: "http://localhost:8080/api/v1/receipts", 
            data: JSON.stringify(req), 
            dataType: "json",
            contentType: "application/json",
            success: function (data, textStatus, jqXHR) {
                switch (jqXHR.status) {
                    case 201:
                        if (!Receipt.Is(data)) {
                            return reject();
                        }
                        
                        return resolve(data);
    
                    default:
                        return reject(jqXHR.status);
                }
            }});
    });
};

export let remove = (id: string): Promise<boolean> => {
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
    })
};