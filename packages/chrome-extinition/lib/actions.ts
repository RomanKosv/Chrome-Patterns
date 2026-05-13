import {ActionInfo as ActionData} from '@chrome-patterns/shared/actions'
import { ContextualTraitSet, StandaloneTraitSet } from './traits'

export type StandaloneActionInfo = ActionData & {strictTraits : StandaloneTraitSet}

export type ContextualActionInfo = StandaloneActionInfo & {
    strictTraits : ContextualTraitSet
}