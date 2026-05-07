import { Message } from "@/lib/messages";
import { isEsentialAction, toActionInfo } from "@/lib/traits-selection";


export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log("content script!")
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
            }
          ),
          type : 'page_action'
        }
        // if (IsEssentialActionTraitSelector.getFrom(message.action)) {
        //   message.action.tryActivateOn(document);
        // }
        if (isEsentialAction(message.action))
          browser.runtime.sendMessage(
            message,
            (response) => {
              console.log("Action delivered!");
            }
          )
      }
    );
  },
});
