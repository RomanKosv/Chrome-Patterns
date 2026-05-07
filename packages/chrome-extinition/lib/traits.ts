import { StrictTraitsSet } from "@chrome-patterns/shared/actions"

export type TraitNames = (
    'actionType'
    | 'pageLocation'
    |'controlElementTagName'
    | 'controlElementText'
)

export type TraitSet = Record<TraitNames, string | undefined> & StrictTraitsSet
