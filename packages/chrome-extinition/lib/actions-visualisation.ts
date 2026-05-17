import { StrictTraitsSet } from "@chrome-patterns/shared/actions";
import { StandaloneTraitSet } from "./traits";
import unknownIconURL from '/images/unknown.png'
import { PublicPath } from "wxt/browser";
import { Message } from "./messages";

export function getVisualisationElementOfAction(
    traits : StandaloneTraitSet, document : Document, width : `${number}${'px' | '%'}`, height : `${number}${'px' | '%'}`
) : HTMLElement {
    if ((traits.actionType === 'click')) {
        try {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'inline-flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.containerType = 'size'
            wrapper.style.width = width
            wrapper.style.height = height
            let label = document.createElement('span')
            label.textContent = `${traits.actionType} on ${traits.pageLocation}`
            const labelHeightPercents = 30
            label.style.fontSize = `clamp(${labelHeightPercents / 2}cqh, ${100/(label.textContent.length + 1)}cqw, ${labelHeightPercents}cqh)`
            label.style.height = `${labelHeightPercents}%`
            label.style.width = '95%'
            label.style.overflow = 'hidden'
            const controlHeightPercent = 100 - labelHeightPercents
            let el = document.createElement(traits.controlElement.tagName)
            el.textContent = traits.controlElement.text
            el.style.fontSize = `clamp(${controlHeightPercent / 3}cqh, ${100 / (el.textContent.length + 1)}cqw, ${controlHeightPercent}cqh)`
            el.style.textAlign = 'center'
            console.log('control element defined on trait set ', traits)
            el.style.width = '95%'
            el.style.height = `${controlHeightPercent}%`
            el.style.borderWidth = '2px'
            el.style.borderRadius = '5px'
            el.style.borderColor = 'black'
            el.style.borderStyle = 'solid'
            el.style.overflow = 'hidden'
            wrapper.append(label, el)
            return wrapper
        }
        catch (e) {
            console.log(
                'error on visualisation of traitSet. trait set: ', traits, 
                'error: ', e)
        }
    }
    else if (traits.actionType === 'edit_text'){
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.containerType = 'size'
        wrapper.style.width = `calc(${width} * 2)`
        wrapper.style.height = height
        let label = document.createElement('span')
        label.textContent = `edit text on ${traits.pageLocation}`
        const labelHeightPercents = 30
        label.style.fontSize = `clamp(${labelHeightPercents / 2}cqh, ${100/(label.textContent.length + 1)}cqw, ${labelHeightPercents}cqh)`
        label.style.height = `${labelHeightPercents}%`
        label.style.width = '95%'
        label.style.overflow = 'hidden'
        const controlHeightPercent = 100 - labelHeightPercents
        const state1 = document.createElement('div')
        state1.textContent = traits.controlElement.placeholder
        state1.style.fontSize = `clamp(${controlHeightPercent / 3}cqh, ${(100 / (state1.textContent.length + 1)) / 2}cqw, ${controlHeightPercent}cqh)`
        state1.style.textAlign = 'center'
        console.log('control element defined on trait set ', traits)
        state1.style.width = '42%'
        state1.style.height = `${controlHeightPercent}%`
        state1.style.borderWidth = '2px'
        state1.style.borderRadius = '5px'
        state1.style.borderColor = 'red'
        state1.style.borderStyle = 'solid'
        state1.style.overflow = 'hidden'
        const state2 = document.createElement('div')
        state2.textContent = traits.newText
        state2.style.fontSize = `clamp(${controlHeightPercent / 3}cqh, ${(100 / (state2.textContent.length + 1)) / 2}cqw, ${controlHeightPercent}cqh)`
        state2.style.textAlign = 'center'
        console.log('control element defined on trait set ', traits)
        state2.style.width = '42%'
        state2.style.height = `${controlHeightPercent}%`
        state2.style.borderWidth = '2px'
        state2.style.borderRadius = '5px'
        state2.style.borderColor = 'green'
        state2.style.borderStyle = 'dashed'
        state2.style.overflow = 'hidden'
        const states = document.createElement('div')
        states.style.display = 'inline-flex';
        states.style.flexDirection = 'row';
        states.style.borderWidth = '1px'
        states.style.borderRadius = '5px'
        states.style.borderColor = 'black'
        states.style.borderStyle = 'dotted'
        states.append(state1, state2)
        wrapper.append(label, states)
        return wrapper
    }
    else {
        const no : never = traits
    }
    let el = document.createElement('img')
    el.src = browser.runtime.getURL(unknownIconURL as PublicPath)
    el.style.width = '100%'
    return el
}

export function getVisualisationElementOfAutomatisation(
    actions : Iterable<StandaloneTraitSet>, document : Document, actionIconWidth : `${number}${'px' | '%'}`, actionIconHeight : `${number}${'px' | '%'}`
) : HTMLElement {
    let list = document.createElement('div')
    list.style.display = 'inline-flex'
    list.style.flexDirection = 'row'
    list.style.borderWidth = '2px'
    list.style.borderRadius = '5px'
    list.style.borderColor = 'yellow'
    list.style.borderStyle = 'solid'
    let automationMessage : Message = {
        type : 'automation_preforming_request',
        automation : Array.from(actions)
    }
    list.addEventListener('click', () => browser.runtime.sendMessage(automationMessage))
    for(let action of actions) 
        list.append(getVisualisationElementOfAction(action, document, actionIconWidth, actionIconHeight))
    return list
}