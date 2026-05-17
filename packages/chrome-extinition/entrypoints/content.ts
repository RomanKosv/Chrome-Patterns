import { StandaloneActionInfo } from "@/lib/actions";
import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation";
import { Message } from "@/lib/messages";
import { toActionInfo } from "@/lib/traits-selection";


export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx) {
    console.log("content script!")
    let pageCreationTime = new Date()
    window.addEventListener(
      'click',
      (event) => {
        console.log('Пользователь кликнул на:', event.target);
        const action = toActionInfo(
          {
            actionType : 'click',
            event : event,
            window : window
          },
          performance.timeOrigin
        )
        if (action !== undefined) {
          const message : Message = {
            action : action,
            type : 'page_action',
            pageCreationTime : pageCreationTime
          }
          browser.runtime.sendMessage(
            message,
            (response) => {
              console.log("Action delivered!");
            }
          )
          console.log("Senden message: ", message)
        }
      }
    );
    window.addEventListener(
      'input',
      (ev) => {
        console.log('input event: ', ev)
        const action  = toActionInfo({actionType : 'input_text', event : ev, window : window}, performance.timeOrigin)
        if (action !== undefined) {
          const message : Message = {
            action : action,
            type : 'page_action',
            pageCreationTime : pageCreationTime
          }
          browser.runtime.sendMessage(message)
        }
      }
    )

    browser.runtime.onMessage.addListener(
      (message_, sender, sendResponse) => {
        const message : Message = message_
        if (message.type === 'action_preforming_reqest') {
          if (message.action.actionType == 'click') {
            const xPath = `//${message.action.controlElement.tagName}[.="${message.action.controlElement.text}"]`
            let control = document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
            if (control instanceof HTMLElement) {
              control.click()
              sendResponse(true)
              console.log("found and clicked, action: ", message.action)
            }
            else{
              sendResponse(false)
              console.error("control not found, action: ", message.action)
            }
          }
          else if (message.action.actionType === 'edit_text') {
            const xPath = `//${message.action.controlElement.tagName}[@placeholder="${message.action.controlElement.placeholder}"]`
            let control = document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
            if ((control instanceof HTMLInputElement) || (control instanceof HTMLTextAreaElement)) {
              control.value = message.action.newText
              sendResponse(true)
            }
            else {
              sendResponse(false)
              console.error('wrong text control or not found: ', control)
            }
          }
          else {
            const no : never = message.action
          }
        }
      }
    )
  },
});
