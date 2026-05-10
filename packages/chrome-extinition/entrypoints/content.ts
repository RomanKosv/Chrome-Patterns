import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation";
import { Message } from "@/lib/messages";
import { isEsentialAction, toActionInfo } from "@/lib/traits-selection";


export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx) {
    console.log("content script!")
    let automations = []
    let hintContainer : HTMLDivElement
    const hintUI = await createShadowRootUi(ctx, {
      position : 'overlay',
      name : 'automatisations-hints-ui',
      onMount: (container) => {
        hintContainer = document.createElement('div')
        hintContainer.style.display = 'inline-flex'
        hintContainer.style.flexDirection = 'column'
        container.append(hintContainer)
      },
    });
    hintUI.mount();
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
    browser.runtime.onMessage.addListener((message_, sender, sendResponse) => {
      let message : Message = message_
      if (message.type === 'automations_update') {
        console.log('got automations: ', message.automations)
        let elements = message.automations.toReversed().map(
          actions => getVisualisationElementOfAutomatisation(actions, document, '80px', '40px')
        )
        hintContainer.replaceChildren()
        for(let el of elements)
          hintContainer.append(el)
        sendResponse('got message')
      }
    })
  },
});
