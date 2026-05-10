import { StrictTraitsSet } from "@chrome-patterns/shared/actions";
import { isCorrectTraitSet, TraitSet } from "./traits";
import unknownIconURL from '/images/unknown.png'
import { PublicPath } from "wxt/browser";

export function getVisualisationElementOfAction(
    traits : StrictTraitsSet, document : Document, width : `${number}${'px' | '%'}`, height : `${number}${'px' | '%'}`
) : HTMLElement {
    if (isCorrectTraitSet(traits)) {
        try {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'inline-flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.containerType = 'size'
            wrapper.style.overflow = 'hidden'
            wrapper.style.width = width
            wrapper.style.height = height
            let label = document.createElement('span')
            label.textContent = `${traits.actionType} on ${traits.pageLocation}`
            label.style.fontSize = '9cqh'
            label.style.height = '10%'
            let el
            if (traits.controlElement !== undefined) {
                el = document.createElement(traits.controlElement.tagName)
                el.textContent = traits.controlElement.text
                el.style.fontSize = '40cqh'
                console.log('control element defined on trait set ', traits)
            }
            else {
                console.log('control element undefined on trait set ', traits)
                el = document.createElement('img')
                el.src = browser.runtime.getURL(unknownIconURL as PublicPath)
            }
            el.style.width = '100%'
            el.style.backgroundColor = 'white'
            el.style.height = '90%'
            wrapper.append(label, el)
            return wrapper
        }
        catch (e) {
            console.log(
                'error on visualisation of traitSet. trait set: ', traits, 
                'error: ', e)
        }
    }
    else
        console.error('incorrect trait set: ', traits)
    let el = document.createElement('img')
    el.src = browser.runtime.getURL(unknownIconURL as PublicPath)
    el.style.width = '100%'
    return el
}

export function getVisualisationElementOfAutomatisation(
    actions : Iterable<StrictTraitsSet>, document : Document, actionIconWidth : `${number}${'px' | '%'}`, actionIconHeight : `${number}${'px' | '%'}`
) : HTMLElement {
    let list = document.createElement('div')
    list.style.display = 'inline-flex'
    list.style.flexDirection = 'row'
    for(let action of actions) 
        list.append(getVisualisationElementOfAction(action, document, actionIconWidth, actionIconHeight))
    return list
}