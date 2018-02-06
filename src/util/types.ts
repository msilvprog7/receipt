export interface Dictionary<T> {
    dictionary: Index<T>
}

export class Dictionary<T> {

    constructor () {
        this.dictionary = {};
    }

    public static Is<T> (dict: any, is: (t: any) => boolean): dict is Dictionary<T> {
        return TypeGuards.IsObject(dict) &&
               TypeGuards.IsObject(dict.dictionary) &&
               Object.keys(dict.dictionary)
                    .every(key => TypeGuards.IsString(key)) &&
               Object.keys(dict.dictionary).map(key => dict.dictionary[key])
                    .every(value => is(value));
    }

    public add (index: string, obj: T): boolean {
        if (this.get(index)) {
            return false;
        }

        this.dictionary[index] = obj;
        return true;
    }

    public any (): boolean {
        return this.count() > 0;
    }

    public count (): number {
        return this.ids().length;
    }

    public edit (index: string, obj: T): boolean {
        if (!this.get(index)) {
            return false;
        }

        this.dictionary[index] = obj;
        return true;
    }

    public get (index: string): T | null {
        return this.dictionary[index] || null;
    }

    public ids (): string[] {
        return Object.keys(this.dictionary);
    }

    public remove (index: string): boolean {
        if (!this.get(index)) {
            return false;
        }

        delete this.dictionary[index];
        return true;
    }

    public values (): T[] {
        return this.ids().map(id => this.dictionary[id]);
    }

}

export interface Error {
    message: string;
}

export class Error {

    constructor (msg: string) {
        this.message = msg;
    }

}

export interface Identifiable {
    id: string
}

export class Identifiable {

    public static Is (identifiable: any): identifiable is Identifiable {
        return TypeGuards.IsObject(identifiable) &&
               TypeGuards.IsString(identifiable.id);
    }

}

export class IdentifiableDictionary<T extends Identifiable> extends Dictionary<T> {

    constructor (objects?: T[]) {
        super();
        
        if (!objects) {
            return;
        }
        
        objects.forEach(object => {
            this.dictionary[object.id] = object;
        });
    }
    
    public static IsIdentifiableDictionary<T extends Identifiable> (
        dict: any, 
        is: (t: any) => boolean): dict is IdentifiableDictionary<T> {
        return TypeGuards.IsObject(dict) &&
               Dictionary.Is<T>(dict, is);
    }

    public addIdentifiable (obj: T): boolean {
        return super.add(obj.id, obj);
    }

    public editIdentifiable (obj: T): boolean {
        return super.edit(obj.id, obj);
    }

}

export interface Index<T> {
    [index: string]: T
}

export class Json {

    public static Parse<T> (obj: any, is: (t: any) => boolean, errorCallback?: () => void): T {
        if (!TypeGuards.IsFunction(errorCallback)) {
            errorCallback = () => { };
        }

        if (!TypeGuards.IsString(obj)) {
            errorCallback();
            return null;
        }
        
        let data: any = JSON.parse(obj);
        if (!TypeGuards.IsObject(data) || !is(data)) {
            errorCallback();
            return null;
        }

        return data as T;
    }

    public static TryParse<T> (obj: any, is: (t: any) => boolean): Promise<T> {
        return new Promise((resolve, reject) => {
            let parsed = Json.Parse<T>(obj, is);
            return (!parsed)
                ? reject()
                : resolve(parsed);
        });
    }

}

export class TypeGuards {

    public static IsNumber (num: any): num is number {
        return num && typeof(num) === "number";
    }

    public static IsString (str: any): str is string {
        return str && typeof(str) === "string";
    }

    public static IsStringDate (date: any): date is string {
        return date && TypeGuards.IsString(date) && new Date(date) instanceof Date;
    }

    public static IsObject (obj: any): obj is any {
        return obj && typeof(obj) === "object";
    }

    public static IsFunction (fcn: any): fcn is any {
        return fcn && typeof(fcn) === "function";
    }

}
