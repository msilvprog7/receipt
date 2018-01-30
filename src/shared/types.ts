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

export interface FormattedDateTime {
    date: string
}

export class FormattedDateTime {
    constructor (dt: Date) {
        this.date = dt.toJSON().split('T')[0]
    }

    public static Is (dt: any): dt is FormattedDateTime {
        // todo: could validate date format, but unused
        return TypeGuards.IsObject(dt) &&
               TypeGuards.IsString(dt.date);
    }
}

export interface FormattedName {
    first: string,
    last: string,
    full: string
}

export class FormattedName {
    public static Is (name: any): name is FormattedName {
        return TypeGuards.IsObject(name) &&
               TypeGuards.IsString(name.first) &&
               TypeGuards.IsString(name.last) &&
               TypeGuards.IsString(name.full);
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
    public static TryParse<T> (obj: any, is: (t: any) => boolean): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!TypeGuards.IsString(obj)) {
                return reject();
            }
            
            let data: any = JSON.parse(obj);
            if (!TypeGuards.IsObject(data) || !is(data)) {
                return reject();
            }

            resolve(data as T);
        });
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
}
