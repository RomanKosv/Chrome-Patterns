import { ContextualActionInfo } from "./actions"
import { AutomationsStorage, PatternTreeNodeID, PatternTreeStorage } from "./pattern-tree"

export type RuntimeState = {
    runtimeStateInited : true
    maxPatternLenght : number,
    username : string
    cursors : (PatternTreeNodeID | null)[],
    localActionsList : ContextualActionInfo[],
    sendedActionsPrefixLenght : number
} & PatternTreeStorage & AutomationsStorage
