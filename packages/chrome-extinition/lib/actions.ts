import {ActionInfo as ActionData} from '@chrome-patterns/shared/actions'
import { TraitSet } from './traits'

export type ActionInfo = ActionData & {strictTraits : TraitSet}
