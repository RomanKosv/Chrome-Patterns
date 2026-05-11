import { Message } from "@/lib/messages";
import { asAutomationSetID, asPatternTreeNodeID, Automation, automationCost, collectBestAutomations, createPatternTreeFromData, getAutomationSetID, getConsequenceOfNode, PatternTreeNodeID, PatternTreeStorage } from "@/lib/pattern-tree";
import { ActionInfo } from "@/lib/actions";
import { PullDataAns, PullDataReq, PushDataAns, PushDataReq } from "@chrome-patterns/shared/requests-data";
import { RuntimeState } from "@/lib/runtime-state";
import { StrictTraitsSet } from "@chrome-patterns/shared/actions";
import stringify from "fast-json-stable-stringify";

const AUTOMATIONS_COUNT = 10

let stateInteractQueue = Promise.resolve();

async function readRuntimeState<Key extends keyof RuntimeState>(fields : Key[]) : Promise<undefined | Pick<RuntimeState, Key>> {
  // console.log("fields to read: ", fields)
  let isInited = (await browser.storage.session.get<{runtimeStateInited : true | undefined}>('runtimeStateInited')).runtimeStateInited
  if (isInited === true) {
    return await browser.storage.session.get<Pick<RuntimeState, Key>>(fields)
  }
  else return undefined
}

async function writeRuntimeState(changes : Partial<RuntimeState>) {
  // console.log("writes changes: ", changes)
  await browser.storage.session.set(changes)
  // console.log("storage state: ", await browser.storage.session.get(null))
}

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
  for(let curs of cursors.slice(1)) {
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
  let automations : StrictTraitsSet[][] = []
  let automationsSet = new Map<string, true>()
  for (const auto of (await getSortedAutomations()).toReversed()) {
    if (automationsSet.size >= AUTOMATIONS_COUNT) break;
    let actions = await automationToActionList(auto)
    let key = stringify(actions)
    if (!automationsSet.has(key)) {
      automations.push(actions)
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

async function shiftCursors(action : ActionInfo) {
  let {cursors, rootPatternTreeNode} = (await readRuntimeState(['cursors', 'rootPatternTreeNode'])) !!
  for (let cursor_i = cursors.length - 2; cursor_i >= 0; cursor_i --) {
    let curr = cursors[cursor_i]
    if (curr !== null) {
      let node = (await readRuntimeState([curr])) !! [curr]
      cursors[cursor_i + 1] = getConsequenceOfNode(node !!, action.strictTraits) ?? null
    }
  }
  cursors[0] = rootPatternTreeNode
  await writeRuntimeState({cursors : cursors})
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
        collectBestAutomations(tree, automations, undefined, AUTOMATIONS_COUNT)
        let settings : Partial<RuntimeState> = {
          runtimeStateInited : true,
          maxPatternLenght : 12,
          username : "test_user_5",
          cursors : new Array(12).fill(null),
          localActionsList : [],
          sendedActionsPrefixLenght : 0
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
            sendResponse('background got message');
            let state = await readRuntimeState(['localActionsList'])
            if (state !== undefined) {
              state.localActionsList.push(action)
              await shiftCursors(action)
              await writeRuntimeState(
                {
                  localActionsList : state.localActionsList
                }
              )
              console.log('sending automations')
              await sendAutomations()
            }
            else console.log("state not inited yet")
          }
        )
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
            let state = await readRuntimeState(['username', 'maxPatternLenght', 'localActionsList', 'sendedActionsPrefixLenght'])
            if (state !== undefined) {
              const respData : PushDataReq = {
                auth : {
                  username : state.username
                },
                settings : {
                  maxPatternLenght : state.maxPatternLenght
                },
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
                        sendedActionsPrefixLenght : state.localActionsList.length
                      }
                    )
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
            else{
              console.error("runtime state not inited")
            }
          }
        )
        
      }
      else if (alarm.name === "pull_alarm") {
        stateInteractQueue = stateInteractQueue.then(
          async () => {
            let state = await readRuntimeState(['username', 'localActionsList'])
            if (state !== undefined) {
              try{
                const req : PullDataReq = {
                  auth : {
                    username : state.username
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
                  else {
                    let tree = createPatternTreeFromData(ans.tree)
                    let automations = {}
                    collectBestAutomations(tree, automations, undefined, AUTOMATIONS_COUNT)
                    let settings : Partial<RuntimeState> = {
                      maxPatternLenght : ans.settings.maxPatternLenght,
                      cursors : new Array<PatternTreeNodeID|null>(ans.settings.maxPatternLenght).fill(null)
                    }
                    settings.cursors!![0] = tree.rootPatternTreeNode
                    await clearPatternTreeAndAutomations()
                    await writeRuntimeState(tree)
                    await writeRuntimeState(automations)
                    await writeRuntimeState(settings)
                    for (let i = Math.max(0, state.localActionsList.length - settings.maxPatternLenght!!); i < state.localActionsList.length; i++) {
                      await shiftCursors(state.localActionsList[i])
                    }
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
            else{
              console.error("runtime state not inited")
            }
          }
        )
        
      }
    }
  )

});
