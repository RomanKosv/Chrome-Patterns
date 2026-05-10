import { StrictTraitsSet } from "@chrome-patterns/shared/actions"
import { ActionInfo } from "./actions"

export type Message = {
    type : 'page_action',
    action : ActionInfo
} | {
    type : 'automations_update',
    automations : StrictTraitsSet[][]
}