import { StrictTraitsSet } from "@chrome-patterns/shared/actions"
import { StandaloneActionInfo } from "./actions"
import { ContextualTraitSet, StandaloneTraitSet } from "./traits"

export type Message = {
    type : 'page_action',
    action : StandaloneActionInfo,
    pageCreationTime : Date
} | {
    type : 'automations_update',
    automations : ContextualTraitSet[][]
} | {
    type : 'action_preforming_reqest',
    action : StandaloneTraitSet
}