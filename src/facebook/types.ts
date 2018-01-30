import { Identifiable, TypeGuards } from "../shared/types";


export interface AuthResponse {
    access_token: string
}

export class AuthResponse {
    public static Is (res: any): res is AuthResponse {
        return TypeGuards.IsObject(res) &&
               TypeGuards.IsString(res.access_token);
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
