import { ActionInfo } from "./traits-selection"

export type Message = {
    type : 'page_action',
    action : ActionInfo
}