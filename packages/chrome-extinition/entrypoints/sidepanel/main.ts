import { getVisualisationElementOfAutomatisation } from "@/lib/actions-visualisation"
import { Message } from "@/lib/messages"
import { ContextualTraitSet } from "@/lib/traits"

async function tryYield() {
    await new Promise(resolve => setTimeout(resolve, 0));
}

class AutomationsVersion {
    actual : boolean
    automations : ContextualTraitSet[][]
    constructor() {
        this.actual = true
        this.automations = []
    }
    async updateAutomationsVisibility(hintContainer : HTMLElement) {
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
        for(let i =0; i < this.automations.length; i++) {
            await tryYield()
            if (!this.actual) {
                console.warn('visibility update interrupted')
                throw new DOMException('The operation was aborted.', 'AbortError');
            }
            if (
                this.automations[i]!!.every(
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
    async initWithAutomations(automations_ : ContextualTraitSet[][], hintContainer : HTMLElement) {
        this.automations = automations_
        let elements = []
        for (const actions of this.automations) {
            tryYield()
            if (!this.actual) {
                console.warn('visualisation interrupted')
                throw new DOMException('The operation was aborted.', 'AbortError');
            }
            const el = getVisualisationElementOfAutomatisation(actions, document, '80px', '40px')
            el.addEventListener('click', () => runAutomation(actions))
            elements.push(el)
        }
        hintContainer.replaceChildren()
        for(let el of elements){
            hintContainer.append(el)
        }
        await this.updateAutomationsVisibility(hintContainer)
    }
}

async function runAutomation(actions : ContextualTraitSet[]) {
    let automationMessage : Message = {
        type : 'automation_preforming_request',
        automation : Array.from(actions)
    }
    const result : boolean = await browser.runtime.sendMessage(automationMessage)
    automationStateSpan.textContent = result ? 'complete' : 'fail'
    automationStateSpan.style.color = result ? 'green' : 'blue'
}

console.log('init sidepanel')

const openMessage : Message = {type : 'sidepanel_opened'}

browser.runtime.sendMessage(
    openMessage
)

const hintContainer = document.getElementById('automations-container') !!
let currentState = new AutomationsVersion()
const automationStateSpan = document.getElementById('automation_state') !!

browser.runtime.onMessage.addListener(
    async (message_, sender, sendResponse) => {
        let message : Message = message_
        if (message.type === 'automations_update') {
            try{
                currentState.actual = false
                currentState = new AutomationsVersion()
                await currentState.initWithAutomations(message.automations, hintContainer)
            }
            catch{}
            finally{
                sendResponse(true);
            }
        }
        else if (message.type === 'automation_preforming_status_message') {
            automationStateSpan.textContent = `doing action ${message.actionIndex + 1}`
            automationStateSpan.style.color = 'orange'
        }
    }
)

browser.tabs.onUpdated.addListener(
    async (_, changeInfo) => {
        if (changeInfo.url !== undefined) {
            console.log('changed url: ', changeInfo.url)
            await currentState.updateAutomationsVisibility(hintContainer)
        }
    }
)

browser.tabs.onRemoved.addListener(
    async (tab) => {
        console.log('tab removed: ', browser.tabs.get(tab))
        await currentState.updateAutomationsVisibility(hintContainer)
    }
)
