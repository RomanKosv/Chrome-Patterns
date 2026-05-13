

export type StrictTraitsSet = unknown

export type ActionInfo = {
    strictTraits : StrictTraitsSet,
    time : Date,
    page : string
}

export function tryGetPageOpenTime(traits : StrictTraitsSet) : number | null {
    if (
        (typeof traits == 'object')
        && (traits !== null)
        && ('relativePageOpenTime' in traits)
        && (typeof traits.relativePageOpenTime == 'number')
        && (traits.relativePageOpenTime >= 0)
    ) {
        return traits.relativePageOpenTime
    }
    else
        return null
}

export function catPageOpenTime(traits : StrictTraitsSet, maximum : number) : StrictTraitsSet {
    let relativePageOpenTime = tryGetPageOpenTime(traits)
    if (relativePageOpenTime === null)
        return traits
    else
        return {
            ...(traits as object),
            relativePageOpenTime : relativePageOpenTime <= maximum ? relativePageOpenTime : null
        }
}