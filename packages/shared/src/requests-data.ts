import type { ActionInfo } from "./actions.js"
import type { PatternTreeNode } from "./pattern-tree.js"
import type { UserAuthData, UserSettings } from "./user.js"

export type PullDataReq = {
    auth : UserAuthData
}

export type PullDataAns = {
    tree : PatternTreeNode,
    settings : UserSettings
} | "fail"

export type PushDataReq = {
    auth : UserAuthData,
    settings : UserSettings,
    actions : ActionInfo[]
}

export type PushDataAns = "succes" | "fail"