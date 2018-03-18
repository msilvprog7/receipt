import * as chai from "chai";
import { Request } from "express";
import * as mocha from "mocha";
import { RequestResponse} from "request";
import * as shortid from "shortid";
import { stub }  from "sinon";
import { ReceiptClient } from "../../src/receipt/api";
import { IReceiptClient, TempUserStore, Receipt, User } from "../../src/receipt/types";
import { ILogger } from "../../src/util/logger/types";
import { IdentifiableDictionary } from "../../src/util/types";


interface Context {
    logger: ILogger,
    tempStore: TempUserStore,
    receiptClient: IReceiptClient
}

class Context {

    public static Default (): Context {
        let logger: ILogger = {
            log: (msg: string) => stub(),
            logRequest: (req: Request) => stub(),
            logResponse: (res: RequestResponse) => stub()
        };

        let tempStore = new TempUserStore();

        return {
            logger: logger,
            tempStore: tempStore,
            receiptClient: new ReceiptClient(logger, tempStore)
        };
    }

    public static User (): User {
        return {
            id: shortid.generate(),
            name: {
                first: "First",
                last: "Last",
                full: "First Last"
            },
            picture: {
                url: "http://localhost:8080/profilepic.png",
                width: 50,
                height: 50
            }
        };
    }

    public static Receipt (): Receipt {
        return {
            id: shortid.generate(),
            transaction: "Transaction",
            amount: 16.99,
            date: new Date(),
            category: "Category"
        };
    }

}

describe ('ReceiptClient', () => {

    before (() => {
        chai.should();
    });

    describe ('#add()', () => {
        it ('should add new user and receipt to store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            
            context.receiptClient.add(user, receipt)
                .then(() => {
                    context.tempStore.get(user.id).should.be.a('object');
                    context.tempStore.get(user.id).get(receipt.id).should.equal(receipt);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });

        it ('should add receipt to existing user in store', done => {
            let context = Context.Default(),
                user = Context.User(),
                oldReceipt = Context.Receipt(),
                newReceipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary([oldReceipt]));

            context.receiptClient.add(user, newReceipt)
                .then(() => {
                    context.tempStore.get(user.id).should.be.a('object');
                    context.tempStore.get(user.id).get(oldReceipt.id).should.equal(oldReceipt);
                    context.tempStore.get(user.id).get(newReceipt.id).should.equal(newReceipt);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });

        it ('should not overwrite existing receipt in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                oldReceipt = Context.Receipt(),
                newReceipt = Context.Receipt();
            newReceipt.id = oldReceipt.id;
            context.tempStore.add(user.id, new IdentifiableDictionary([oldReceipt]));

            context.receiptClient.add(user, newReceipt)
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    context.tempStore.get(user.id).should.be.a('object');
                    context.tempStore.get(user.id).get(oldReceipt.id).should.equal(oldReceipt);
                    context.tempStore.get(user.id).get(newReceipt.id).should.equal(oldReceipt);
                    done();
                });
        });
    });

    describe ('#all()', () => {
        it ('should return none if no user in store', done => {
            let context = Context.Default(),
                user = Context.User();

            context.receiptClient.all(user)
                .then(receipts => {
                    receipts.should.have.length(0);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });

        it ('should return none if user in store has no receipts', done => {
            let context = Context.Default(),
                user = Context.User();
            context.tempStore.add(user.id, new IdentifiableDictionary());

            context.receiptClient.all(user)
                .then(receipts => {
                    receipts.should.have.length(0);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });

        it ('should return user receipts', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt(),
                receipt2 = Context.Receipt(),
                receipt3 = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary([receipt, receipt2, receipt3]));

            context.receiptClient.all(user)
                .then(receipts => {
                    receipts.should.have.length(3);
                    receipts.should.contain(receipt);
                    receipts.should.contain(receipt2);
                    receipts.should.contain(receipt3);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });

    });

    describe ('#edit()', () => {
        it ('should fail if user not in store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();

            context.receiptClient.edit(user, receipt)
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should fail if receipt not in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary());

            context.receiptClient.edit(user, receipt)
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should replace if receipt is in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt(),
                receipt2 = Context.Receipt();
            receipt2.id = receipt.id;
            context.tempStore.add(user.id, new IdentifiableDictionary([receipt]));

            context.receiptClient.edit(user, receipt)
                .then(() => {
                    context.tempStore.get(user.id).get(receipt.id).should.equal(receipt2);
                    context.tempStore.get(user.id).get(receipt2.id).should.equal(receipt2);
                    done();
                })
                .catch(() => {
                    done();
                });
        });
    });

    describe ('#get()', () => {
        it ('should fail if user not in store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();

            context.receiptClient.get(user, receipt.id)
                .then(r => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should fail if receipt not in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary());

            context.receiptClient.get(user, receipt.id)
                .then(r => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should retrieve receipt in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary([receipt]));

            context.receiptClient.get(user, receipt.id)
                .then(r => {
                    r.should.equal(receipt);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });
    });

    describe ('#remove()', () => {
        it ('should fail if user not in store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();

            context.receiptClient.remove(user, receipt.id)
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should fail if receipt not in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary());

            context.receiptClient.remove(user, receipt.id)
                .then(() => {
                    done(new Error("Should not succeed"));
                })
                .catch(() => {
                    done();
                });
        });

        it ('should remove receipt in user store', done => {
            let context = Context.Default(),
                user = Context.User(),
                receipt = Context.Receipt();
            context.tempStore.add(user.id, new IdentifiableDictionary([receipt]));

            context.receiptClient.remove(user, receipt.id)
                .then(() => {
                    context.tempStore.get(user.id).values().should.have.length(0);
                    done();
                })
                .catch(() => {
                    done(new Error("Should not fail"));
                });
        });
    });

});
