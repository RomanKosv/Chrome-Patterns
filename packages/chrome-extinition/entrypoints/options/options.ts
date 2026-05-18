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

const openDeleteButton = document.getElementById("open-delete") !!
const pagesTODelete = document.getElementById("pageRegexp") !! as HTMLInputElement
const startTime = document.getElementById("startTime") !! as HTMLInputElement
const endTime = document.getElementById("endTime") !! as HTMLInputElement
const deleteDialog = document.getElementById("remove-dialog") !! as HTMLDialogElement

openDeleteButton.addEventListener(
    'click',
    (ev) => {
        deleteDialog.showModal()
    }
)

startTime.addEventListener(
    'change',
    (ev) => {
        endTime.min = startTime.value
    }
)

endTime.addEventListener(
    'change',
    (ev) => {
        startTime.max = endTime.value
    }
)

deleteDialog.addEventListener(
    'close',
    async (ev) => {
        if (deleteDialog.returnValue === 'confirm') {
            try {
                const message : Message = {
                    type : 'delete_data',
                    pages : pagesTODelete.value,
                    startTime : new Date(startTime.value),
                    endTime : new Date(endTime.value)
                }
                await browser.runtime.sendMessage(message)
            }
            catch (e) {
                console.error(e)
            }
            
        }
    }
)