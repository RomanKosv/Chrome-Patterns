import { Message } from "@/lib/messages";
import { asAutomationSetID, asPatternTreeNodeID, Automation, automationCost, collectBestAutomations, createPatternTreeFromData, getAutomationSetID, getConsequenceOfNode, PatternTreeNodeID, PatternTreeStorage } from "@/lib/pattern-tree";
import { ContextualActionInfo, StandaloneActionInfo } from "@/lib/actions";
import { PullDataAns, PullDataReq, PushDataAns, PushDataReq } from "@chrome-patterns/shared/requests-data";
import { readRuntimeState, RuntimePatternsState, RuntimeSettings, RuntimeState, writeRuntimeState } from "@/lib/runtime-state";
import { catPageOpenTime, StrictTraitsSet } from "@chrome-patterns/shared/actions";
import stringify from "fast-json-stable-stringify";
import { asContextualTraitSet, ContextualTraitSet, isCorrectTraitSet, StandaloneTraitSet } from "@/lib/traits";

const RUN_ACTION_ATTEMPTS = 3
const SLEEP_AFTER_ACTION_MS = 200

let stateInteractQueue = Promise.resolve();


async function clearPatternTreeAndAutomations() {
  let toRemove : (keyof RuntimeState)[] = []
  for (let key of (await browser.storage.session.getKeys()) as (keyof RuntimeState)[]) {
    let nodeID = asPatternTreeNodeID(key)
    if (nodeID !== undefined) {
      toRemove.push(nodeID)
    }
    else {
      let automationSetID = asAutomationSetID(key)
      if (automationSetID !== undefined) {
        toRemove.push(automationSetID)
      }
    }
  }
  await browser.storage.session.remove<RuntimeState>(toRemove)
}

async function getSortedAutomations() : Promise<(Automation & {baseNode : PatternTreeNodeID})[]> {
  let {
    cursors, 
    probabilityMetricOfFullVariety
  } = (await readRuntimeState(['cursors', 'probabilityMetricOfFullVariety'])) !!
  let automations : (Automation & {baseNode : PatternTreeNodeID})[] = []
  for(let curs of cursors) {
    if (curs !== null) {
      const autoID = getAutomationSetID(curs)
      let automationsSubset = (await readRuntimeState([autoID]))!![autoID]!!
      let node = (await readRuntimeState([curs]))!![curs] !!
      for (let auto of automationsSubset) {
        automations.push(
          {
            lastNode : auto.lastNode,
            lenght : auto.lenght,
            chanseMetric : auto.chanseMetric / (
              node.increment?.probabilityMetric ?? probabilityMetricOfFullVariety
            ),
            baseNode : curs
          }
        )
      }
    }
  }
  automations.sort(
    (a, b) => automationCost(a) - automationCost(b)
  )
  return automations
}

async function automationToActionList(automation : {baseNode : PatternTreeNodeID, lastNode : PatternTreeNodeID}) : Promise<StrictTraitsSet[]> {
  if (automation.baseNode === automation.lastNode) return []
  else {
    let lastNode = (await readRuntimeState([automation.lastNode])) !! [automation.lastNode] !!
    let pref = await automationToActionList({baseNode : automation.baseNode, lastNode : lastNode.increment!.parentID})
    pref.push(lastNode.increment!.lastActionTraits)
    return pref
  }
}

async function sendAutomations() {
  let autoCount = (await readRuntimeState(['automationsCount'])) !!.automationsCount
  let automations : ContextualTraitSet[][] = []
  let automationsSet = new Map<string, true>()
  for (const auto of (await getSortedAutomations()).toReversed()) {
    if (automationsSet.size >= autoCount) break;
    let actions = await automationToActionList(auto)
    let key = stringify(actions)
    if ((!automationsSet.has(key)) && (actions.every(isCorrectTraitSet))) {
      automations.push(actions.map(asContextualTraitSet))
      automationsSet.set(key, true)
    }
  }
  let message : Message = {
    type : 'automations_update',
    automations : automations
  }
  try{
    await browser.runtime.sendMessage(
      message
    )
  }
  catch(e) {
    console.error('error on sending message to page: ', e)
  }
}

async function shiftCursors(action_ : ContextualActionInfo) {
  let {cursors, rootPatternTreeNode} = (await readRuntimeState(['cursors', 'rootPatternTreeNode'])) !!
  for (let cursor_i = cursors.length - 2; cursor_i >= 0; cursor_i --) {
    let action = {
      ...action_,
      strictTraits : catPageOpenTime(action_.strictTraits, cursor_i - 1)
    }
    let curr = cursors[cursor_i]
    if (curr !== null) {
      let node = (await readRuntimeState([curr])) !! [curr]
      cursors[cursor_i + 1] = getConsequenceOfNode(node !!, action.strictTraits) ?? null
    }
  }
  cursors[0] = rootPatternTreeNode
  await writeRuntimeState({cursors : cursors})
}

async function tryRunAction(action : StandaloneTraitSet) : Promise<boolean> {
  if (action.actionType === 'click') {
    let tabs = (await browser.tabs.query({})).filter(
      tab => {
        if (tab.url !== undefined){
          try{
            const url = new URL(tab.url)
            return (url.host + url.pathname) === action.pageLocation
          }
          catch {
            return false
          }
        }
        else
          return false
      }
    )
    for(let tryInd = 0 ; tryInd < RUN_ACTION_ATTEMPTS; tryInd++) {
      let tryArain : Browser.tabs.Tab[] = []
      for(const tab of tabs) {
        if (tab.id !== undefined) {
          const message : Message = {
            type : 'action_preforming_reqest',
            action : action
          }
          try {
            const done = await browser.tabs.sendMessage(tab.id, message)
            if (done)
              return true
          }
          catch (e){
            tryArain.push(tab)
            console.error("error on sending reqest on action preforming: ", e)
          }
        }
      }
      if (tryArain.length === 0)
        break;
      else{
        tabs = tryArain
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    return false
  }
  const no : never = action.actionType
  return no;
}

async function runAutomation(actions : StandaloneTraitSet[]) : Promise<boolean> {
  for(
    const [action, i] of actions.map<[StandaloneTraitSet, number]>(
      (a, i) => [a, i]
    )
  ) {
    let inProcessMessage : Message = {
      type : 'automation_preforming_status_message',
      status : 'doing_action',
      actionIndex : i
    }
    browser.runtime.sendMessage(
      inProcessMessage
    )
    if (! (await tryRunAction(action)))
      return false
    if (i < actions.length - 1)
      await new Promise(resolve => setTimeout(resolve, SLEEP_AFTER_ACTION_MS))
  }
  return true
}

async function getAuthToken() : Promise<string | undefined> {
    console.log('try getAuth')
    try {
      const tokenRes = await browser.identity.getAuthToken({interactive : true})
      return tokenRes.token
    }
    catch (e) {
      console.error('error on getting token: ', e)
      return undefined
    }
}

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  

  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error))

  stateInteractQueue = stateInteractQueue.then(
    async () => {
      let state = await readRuntimeState([])
      if (state === undefined) {
        console.log("startup")
        let tree = createPatternTreeFromData(
          {
            consequences : []
          }
        )
        let automations = {}
        collectBestAutomations(tree, automations, undefined, 30)
        let settings : RuntimeSettings & RuntimePatternsState = {
          runtimeStateInited : true,
          automationsCount : 30,
          maxPatternLenght : 12,
          cursors : new Array(12).fill(null),
          localActionsList : [],
          sendedActionsPrefixLenght : 0,
          settingsLocallyChanged : false
        }
        settings.cursors!![0] = tree.rootPatternTreeNode
        await writeRuntimeState(tree)
        await writeRuntimeState(automations)
        await writeRuntimeState(settings)
      }
    }
  )

  browser.runtime.onMessage.addListener(
    (message_, sender, sendResponse) => {
      const message : Message = message_
      if (message.type === 'page_action') {
        let action = message.action
        stateInteractQueue = stateInteractQueue.then(
          async () => {
            let state = await readRuntimeState(['localActionsList'])
            if (state !== undefined) {
              let minPageCreationN = 0;
              let maxPageCreationN = state.localActionsList.length
              while (maxPageCreationN - minPageCreationN > 0) {
                let n = Math.floor((minPageCreationN + maxPageCreationN) / 2)
                if (state.localActionsList[n]!!.time <= message.pageCreationTime)
                  minPageCreationN = n+1
                else
                  maxPageCreationN = n
              }
              let contextualAction : ContextualActionInfo = {
                ...action,
                strictTraits : {
                  ...action.strictTraits,
                  relativePageOpenTime : minPageCreationN > 0 ? state.localActionsList.length - minPageCreationN : null
                }
              }
              state.localActionsList.push(contextualAction)
              await shiftCursors(contextualAction)
              await writeRuntimeState(
                {
                  localActionsList : state.localActionsList
                }
              )
              console.log('sending automations')
              await sendAutomations()
            }
            else console.log("state not inited yet")
            sendResponse('background got message');
          }
        )
        return true;
      }
      else if (message.type === 'automation_preforming_request') {
        console.log('start automation preforming')
        runAutomation(message.automation).then(
          sendResponse
        )
        return true
      }
      else if (message.type === 'write_state') {
        console.log('writing state from another script, changes: ', message)
        stateInteractQueue = stateInteractQueue.then(
          async () => {
            await writeRuntimeState(message.changes)
            sendResponse('background writen')
          }
        )
        return true
      }
    }
  )

  browser.runtime.onInstalled.addListener(() => {
    browser.alarms.create("push_alarm", { periodInMinutes : 0.1 });
    browser.alarms.create("pull_alarm", { periodInMinutes: 0.1 });
  })
  browser.alarms.onAlarm.addListener(
    (alarm) => {
      if (alarm.name === "push_alarm") {
        stateInteractQueue = stateInteractQueue.then(
          async () => {
            let state = await readRuntimeState(['maxPatternLenght', 'automationsCount', 'localActionsList', 'sendedActionsPrefixLenght', 'settingsLocallyChanged'])
            if (state !== undefined) {
              const authToken = await getAuthToken()
              if (authToken !== undefined) {
                const respData : PushDataReq = {
                  auth : {
                    googleOauthToken : authToken
                  },
                  settings : state.settingsLocallyChanged ? {
                    maxPatternLenght : state.maxPatternLenght,
                    automationsCount : state.automationsCount
                  } : undefined,
                  actions : 
                    state.localActionsList.slice(
                      state.sendedActionsPrefixLenght
                    ),
                  actionsPrefix : state.localActionsList.slice(
                    Math.max(
                      0, 
                      state.sendedActionsPrefixLenght - state.maxPatternLenght
                    ),
                    state.sendedActionsPrefixLenght
                  )
                }
                try{
                  let fetchRes = await fetch('http://localhost:3006/push_data', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(respData)
                  })
                  if (fetchRes.ok) {
                    const ans : PushDataAns = await fetchRes.json()
                    console.log("push answer: ", ans)
                    if (ans === "succes") {
                      console.log("sucessful push")
                      await writeRuntimeState(
                        {
                          sendedActionsPrefixLenght : state.localActionsList.length,
                          settingsLocallyChanged : false
                        }
                      )
                    }
                    else if (ans === 'authFailed') {
                      console.error('autn failed on server side')
                      await browser.identity.removeCachedAuthToken({token : authToken})
                    }
                    else {
                      console.log("server push logic went wrong, answer: ", ans)
                    }
                  }
                  else {
                    console.error("Bed answer code on push")
                  }
                }
                catch(err){
                  console.error("error on push: ", err)
                }
              }
              else
                console.error('failed to get token from user')
            }
            else{
              console.error("runtime state not inited")
            }
          }
        )
        
      }
      else if (alarm.name === "pull_alarm") {
        stateInteractQueue = stateInteractQueue.then(
          async () => {
            let state = await readRuntimeState(['localActionsList', 'settingsLocallyChanged'])
            if (state !== undefined) {
              const authToken = await getAuthToken()
              if (authToken !== undefined) {
                try{
                  const req : PullDataReq = {
                    auth : {
                      googleOauthToken : authToken
                    }
                  }
                  let fetchAns = await fetch('http://localhost:3006/pull_data', 
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body : JSON.stringify(req)
                    }
                  )
                  if (fetchAns.ok) {
                    const ans : PullDataAns = await fetchAns.json()
                    console.log("pull answer: ", ans)
                    if (ans === "fail") {
                      console.error("some error on server side (pull data)")
                    }
                    else if (ans === 'authFailed') {
                      console.error('autn failed on server side')
                      await browser.identity.removeCachedAuthToken({token : authToken})
                    }
                    else {
                      let tree = createPatternTreeFromData(ans.tree)
                      let automations = {}
                      collectBestAutomations(tree, automations, undefined, ans.settings.automationsCount)
                      let settings : Partial<RuntimeSettings> = {
                        maxPatternLenght : ans.settings.maxPatternLenght,
                        automationsCount : ans.settings.automationsCount,
                      }
                      let cursors = new Array<PatternTreeNodeID|null>(ans.settings.maxPatternLenght).fill(null)
                      cursors[0] = tree.rootPatternTreeNode
                      await clearPatternTreeAndAutomations()
                      await writeRuntimeState(tree)
                      await writeRuntimeState(automations)
                      await writeRuntimeState({cursors : cursors})
                      if (!state.settingsLocallyChanged)
                        await writeRuntimeState(settings)
                      for (let i = Math.max(0, state.localActionsList.length - settings.maxPatternLenght!!); i < state.localActionsList.length; i++) {
                        await shiftCursors(state.localActionsList[i])
                      }
                      await sendAutomations()
                      console.log("succesful pull")
                    }
                  }
                  else {
                    console.error("beg response status code on pull")
                  }
                }
                catch(e){
                  console.error("some error on pull: ", e)
                }
              }
            }
            else{
              console.error("runtime state not inited")
            }
          }
        )
        
      }
    }
  )

});
