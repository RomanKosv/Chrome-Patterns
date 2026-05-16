import type { ActionInfo } from "./actions.js"
import type { PatternTreeNode } from "./pattern-tree.js"
import type { UserAuthData, UserSettings } from "./user.js"

export type ReqestWithAuth = {
    auth : UserAuthData
}

export type AuthFailAns = 'authFailed'

export type PullDataReq = ReqestWithAuth

export type PullDataAns = {
    tree : PatternTreeNode,
    settings : UserSettings
} | "fail" | AuthFailAns

export type PushDataReq = {
    settings? : UserSettings,
    actions : ActionInfo[],
    actionsPrefix : ActionInfo[]
} & ReqestWithAuth

export type PushDataAns = "succes" | "fail" | AuthFailAns