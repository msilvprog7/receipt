import { Application } from "express";
import { Receipt, TempUserStore, User } from "./types";
import { IdentifiableDictionary, TypeGuards, Identifiable } from "../shared/types";

const tempStore: TempUserStore = new TempUserStore();


export let add = (app: Application, user: User, receipt: Receipt): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tempStore.get(user.id) && !tempStore.add(user.id, new IdentifiableDictionary<Receipt>())) {
            return reject();
        }

        return (!tempStore.get(user.id).addIdentifiable(receipt))
            ? reject()
            : resolve();
    });
}

export let all = (app: Application, user: User): Promise<Receipt[]> => {
    return new Promise((resolve, reject) => {
        return (!tempStore.get(user.id))
            ? resolve([])
            : resolve(tempStore.get(user.id).values());
    });
}

export let edit = (app: Application, user: User, receipt: Receipt): Promise<void> => {
    return new Promise((resolve, reject) => {
        return (!tempStore.get(user.id) || !tempStore.get(user.id).editIdentifiable(receipt))
            ? reject()
            : resolve();
    });
}

export let get = (app: Application, user: User, id: string): Promise<Receipt> => {
    return new Promise((resolve, reject) => {
        return (!tempStore.get(user.id) || !tempStore.get(user.id).get(id))
            ? reject()
            : resolve(tempStore.get(user.id).get(id));
    });
}

export let remove = (app: Application, user: User, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        return (!tempStore.get(user.id) || !tempStore.get(user.id).remove(id))
            ? reject()
            : resolve();
    });
}
