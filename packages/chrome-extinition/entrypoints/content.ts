import { SerializedAction } from "@/lib/serialisation";
import { IsEssentialActionTraitSelector } from "@/lib/traits";




export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    window.addEventListener(
      'click',
      (event) => {
        console.log('Пользователь кликнул на:', event.target);
        const message = {
          action : new SerializedAction(
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
