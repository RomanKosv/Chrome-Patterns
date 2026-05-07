import { Message } from "@/lib/messages";
import { PatternTreeNode } from "@/lib/pattern-tree";
import { ActionInfo } from "@/lib/actions";
import { PullDataAns, PullDataReq, PushDataAns, PushDataReq } from "@chrome-patterns/shared/requests-data";

let actionsList : Array<ActionInfo> = []

let PATTERN_MAX_LENGHT = 10;

let prefixTree : PatternTreeNode = new PatternTreeNode({consequences : []})
let cursors : (PatternTreeNode|undefined)[] = []
for(let i = 0; i < PATTERN_MAX_LENGHT; i ++) {
  cursors.push(undefined)
}
cursors[0] = prefixTree

function shiftCursors(action : ActionInfo) {
  for (let cursor_i = 0; cursor_i < cursors.length - 1; cursor_i ++) {
    cursors[cursor_i + 1] = cursors[cursor_i]?.getConsequense(action.strictTraits)
  }
  cursors[0] = prefixTree
}

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  browser.runtime.onMessage.addListener(
    (message_, sender, sendResponse) => {
      const message : Message = message_
      if (message.type === 'page_action') {
        let action = message.action
        console.log(action)
        actionsList.push(action)
        shiftCursors(action)
      }
      sendResponse('background got message');
    }
  )

  browser.alarms.create("push_alarm", { delayInMinutes : 1 });
  browser.alarms.create("pull_alarm", { delayInMinutes: 1 });

  browser.alarms.onAlarm.addListener(
    (alarm) => {
      if (alarm.name === "push_alarm") {
        const respData : PushDataReq = {
          auth : {
            username : 'test_user_1'
          },
          settings : {
            maxPatternLenght : PATTERN_MAX_LENGHT
          },
          actions : actionsList
        }
        fetch('https://localhost:3006/push_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(respData)
        }).then(
          ans_ => {
            if (ans_.ok) {
              return ans_.json()
            }
            else throw new Error("Bed answer code on push")
          }
        ).then(
          ans_ => {
            const ans : PushDataAns = ans_
            if (ans === "succes") {
              console.log("sucessful push")
            }
            else {
              console.log("server push logic went wrong, answer: ", ans)
            }
          }
        ).catch(
          err => {
            console.error("error on push: ", err)
          }
        )
      }
      else if (alarm.name === "pull_alarm") {
        const req : PullDataReq = {
          auth : {
            username : 'test_user_1'
          }
        }
        fetch('https://localhost:3006/push_data', 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body : JSON.stringify(req)
          }
        ).then(
          ans_ => {
            if (ans_.ok) {
              return ans_.json()
            }
            else throw new Error("Bed answer code on push")
          }
        ).then(
          ans_ => {
            const ans : PullDataAns = ans_
            if (ans === "fail") {
              console.error("some error on server side (pull data)")
            }
            else {
              prefixTree = new PatternTreeNode(ans.tree)
              PATTERN_MAX_LENGHT = ans.settings.maxPatternLenght
              cursors = new Array<PatternTreeNode|undefined>(PATTERN_MAX_LENGHT).fill(undefined)
              cursors[0] = prefixTree
              for (let i = 0; (i < PATTERN_MAX_LENGHT) && (i < actionsList.length); i++) {
                shiftCursors(actionsList[i])
              }
            }
          }
        )
      }
    }
  )

});
