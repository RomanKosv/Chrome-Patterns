import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation"
import { Message } from "@/lib/messages"

console.log('init sidepanel')

let hintContainer = document.getElementById('automations-container') !!

browser.runtime.onMessage.addListener((message_, sender, sendResponse) => {
    let message : Message = message_
    if (message.type === 'automations_update') {
        console.error('got automations: ', message.automations)
        let elements = message.automations.map(
            actions => getVisualisationElementOfAutomatisation(actions, document, '80px', '40px')
        )
        hintContainer.replaceChildren()
        for(let el of elements)
            hintContainer.append(el)
        sendResponse('got message')
    }
})