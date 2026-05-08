import { ActionInfo } from "./actions"
import { AutomationsStorage, PatternTreeNodeID, PatternTreeStorage } from "./pattern-tree"

export type RuntimeState = {
    runtimeStateInited : true
    maxPatternLenght : number,
    username : string
    cursors : (PatternTreeNodeID | null)[],
    localActionsList : ActionInfo[],
    sendedActionsPrefixLenght : number
} & PatternTreeStorage & AutomationsStorage
