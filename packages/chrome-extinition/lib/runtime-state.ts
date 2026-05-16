import { ContextualActionInfo } from "./actions"
import { AutomationsStorage, PatternTreeNodeID, PatternTreeStorage } from "./pattern-tree"

export type RuntimeSettings = {
    maxPatternLenght : number
    automationsCount : number
    settingsLocallyChanged : boolean
}

export type RuntimePatternsState = {
    runtimeStateInited : true
    cursors : (PatternTreeNodeID | null)[],
    localActionsList : ContextualActionInfo[],
    sendedActionsPrefixLenght : number
} 

export type RuntimeState = RuntimeSettings & RuntimePatternsState & PatternTreeStorage & AutomationsStorage

export async function readRuntimeState<Key extends keyof RuntimeState>(fields : Key[]) : Promise<undefined | Pick<RuntimeState, Key>> {
  // console.log("fields to read: ", fields)
  let isInited = (await browser.storage.session.get<{runtimeStateInited : true | undefined}>('runtimeStateInited')).runtimeStateInited
  if (isInited === true) {
    return await browser.storage.session.get<Pick<RuntimeState, Key>>(fields)
  }
  else return undefined
}

export async function writeRuntimeState(changes : Partial<RuntimeState>) {
  // console.log("writes changes: ", changes)
  await browser.storage.session.set(changes)
  // console.log("storage state: ", await browser.storage.session.get(null))
}