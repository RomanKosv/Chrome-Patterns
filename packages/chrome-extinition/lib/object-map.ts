import stringfy from 'fast-json-stable-stringify'

export type ObjectMap<T> = Record<string, T|undefined>

export function getFrom<T>(map : ObjectMap<T>, key : unknown) : T | undefined {
    return map[stringfy(key)]
}

export function setTo<T>(map : ObjectMap<T>, key : unknown, val : T) {
    map[stringfy(key)] = val
}
