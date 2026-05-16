import { StrictTraitsSet } from "@chrome-patterns/shared/actions"
import { StandaloneActionInfo } from "./actions"
import { ContextualTraitSet, StandaloneTraitSet } from "./traits"
import { RuntimeState } from "./runtime-state"

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
} | {
    type : 'automation_preforming_request',
    automation : StandaloneTraitSet[]
} | {
    type : 'automation_preforming_status_message',
    status : 'doing_action',
    actionIndex : number
} | {
    type : 'write_state',
    changes : Partial<RuntimeState>
}