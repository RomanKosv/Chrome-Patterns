import { StrictTraitsSet } from "@chrome-patterns/shared/actions"
import { StandaloneActionInfo } from "./actions"

export type Message = {
    type : 'page_action',
    action : StandaloneActionInfo,
    pageCreationTime : Date
} | {
    type : 'automations_update',
    automations : StrictTraitsSet[][]
}