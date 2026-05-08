import { ActionInfo } from "./actions"

export type Message = {
    type : 'page_action',
    action : ActionInfo
}