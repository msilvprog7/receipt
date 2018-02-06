import { Application, Request } from "express";
import { OAuth2Client } from "../types";
import { Identifiable, TypeGuards } from "../../util/types";


export interface Config {
    client_id: string,
    client_secret: string,
    version: string,
    scope: string
}

export class Config {

    public static Is (config: any): config is Config {
        return TypeGuards.IsObject(config) &&
               TypeGuards.IsString(config.client_id) &&
               TypeGuards.IsString(config.client_secret) &&
               TypeGuards.IsString(config.version) &&
               TypeGuards.IsString(config.scope);
    }

}

export interface DataWrapper<T> {
    data: T
}

export class DataWrapper<T> {

    public static Is<T> (wrapper: any, is: (data: any) => boolean): wrapper is DataWrapper<T> {
        return TypeGuards.IsObject(wrapper) &&
               is(wrapper.data);
    }

}

export abstract class IFacebookClient extends OAuth2Client {

    public abstract getUser(req: Request): Promise<User>;

}

export interface Picture {
    url: string,
    width: number,
    height: number
}

export class Picture {

    public static Is (pic: any): pic is Picture {
        return TypeGuards.IsObject(pic) &&
               TypeGuards.IsString(pic.url) &&
               TypeGuards.IsNumber(pic.width) &&
               TypeGuards.IsNumber(pic.height);
    }

}

export interface User extends Identifiable {
    name: string,
    picture: DataWrapper<Picture>
}

export class User {

    public static Is (user: any): user is User {
        return TypeGuards.IsObject(user) &&
               TypeGuards.IsString(user.id) &&
               TypeGuards.IsString(user.name) &&
               DataWrapper.Is<Picture>(user.picture, Picture.Is)
    }

}
