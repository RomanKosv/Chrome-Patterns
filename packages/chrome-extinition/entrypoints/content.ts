import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation";
import { Message } from "@/lib/messages";
import { isEsentialAction, toActionInfo } from "@/lib/traits-selection";


export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx) {
    console.log("content script!")
    let pageCreationTime = new Date()
    window.addEventListener(
      'click',
      (event) => {
        console.log('Пользователь кликнул на:', event.target);
        const message : Message = {
          action : toActionInfo(
            {
              actionType : 'click',
              event : event,
              window : window
            },
            performance.timeOrigin
          ),
          type : 'page_action',
          pageCreationTime : pageCreationTime
        }
        // if (IsEssentialActionTraitSelector.getFrom(message.action)) {
        //   message.action.tryActivateOn(document);
        // }
        if (isEsentialAction(message.action)){
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
  },
});
