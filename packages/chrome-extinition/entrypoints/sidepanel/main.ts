import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation"
import { Message } from "@/lib/messages"
import { ContextualTraitSet } from "@/lib/traits"

console.log('init sidepanel')

let hintContainer = document.getElementById('automations-container') !!
let automations : ContextualTraitSet[][] = []

async function updateAutomationsVisibility() {
    let tabs = new Set(
        (await browser.tabs.query({})).map(
            tab => {
                if (tab.url !== undefined){
                    try{
                        const url = new URL(tab.url)
                        return url.host+url.pathname
                    }
                    catch{
                        return undefined
                    }
                }
                else return undefined
            }
        ).filter(x=> x !== undefined)
    )
    for(let i =0; i < automations.length; i++) {
        if (
            automations[i]!!.every(
                (a, step) => (tabs.has(a.pageLocation))
                    || (
                        (step > 0) 
                        && (a.relativePageOpenTime!==null)
                        && (a.relativePageOpenTime < step)
                    )
            )
        ) {
            let child = hintContainer.childNodes[i]
            if (child instanceof HTMLElement)
                child.style.display = ''
        }
        else{
            let child = hintContainer.childNodes[i]
            if (child instanceof HTMLElement)
                child.style.display = 'none'
        }
    }
}

browser.runtime.onMessage.addListener(
    async (message_, sender, sendResponse) => {
        let message : Message = message_
        if (message.type === 'automations_update') {
            console.log('got automations: ', message.automations)
            automations = message.automations 
            let elements = message.automations.map(
                actions => getVisualisationElementOfAutomatisation(actions, document, '80px', '40px')
            )
            hintContainer.replaceChildren()
            for(let el of elements)
                hintContainer.append(el)
            await updateAutomationsVisibility()
            sendResponse('got message')
        }
    }
)

browser.tabs.onUpdated.addListener(
    async (_, changeInfo) => {
        if (changeInfo.url !== undefined) {
            console.log('changed url: ', changeInfo.url)
            await updateAutomationsVisibility()
        }
    }
)

browser.tabs.onRemoved.addListener(
    async (tab) => {
        console.log('tab removed: ', browser.tabs.get(tab))
        await updateAutomationsVisibility();
    }
)
