import type { StrictTraitsSet } from "./actions.js"

export type PatternConsquense = {
    traits : StrictTraitsSet,
    enterCount : number,
    node : PatternTreeNode
}

export type PatternTreeNode = {
    consequences : PatternConsquense[]
}