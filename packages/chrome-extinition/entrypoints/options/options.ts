import { Message } from "@/lib/messages"
import { readRuntimeState, writeRuntimeState } from "@/lib/runtime-state"

console.log('start')

const maxPatternLenghtControl = document.getElementById("max_pattern_lenght")!! as HTMLInputElement

const automationsCountControl = document.getElementById("automations_count")!! as HTMLInputElement

readRuntimeState(['maxPatternLenght', 'automationsCount']).then(
    (state) => {
        if (state !== undefined) {
            maxPatternLenghtControl.value = state.maxPatternLenght.toString()
            automationsCountControl.value = state.automationsCount.toString()
        }
    }
)



const saveButton = document.getElementById('save') !!

saveButton.addEventListener(
    'click',
    async (ev) => {
        const message : Message = {
            type : 'write_state',
            changes : {
                settingsLocallyChanged : true,
                automationsCount : Number.parseInt(automationsCountControl.value),
                maxPatternLenght : Number.parseInt(maxPatternLenghtControl.value)
            }
        }
        console.log('writing settings: ', message)
        await browser.runtime.sendMessage(message)
    }
)