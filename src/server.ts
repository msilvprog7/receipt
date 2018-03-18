import { ReceiptClient } from "./receipt/api";
import { RouteClient } from "./route/api";
import { FacebookClient } from "./user/facebook/api";
import { Logger } from "./util/logger/api";


let logger = new Logger();
let routeClient = new RouteClient(
    logger,
    new FacebookClient(logger), 
    new ReceiptClient(logger));
routeClient.listen();
