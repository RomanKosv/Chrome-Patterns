import { RealtimeAction } from "./realtime_actions";
import { TraitSet } from "./traits";
import { ActionInfo } from "./actions";

interface TraitSelector<TraitName = string> {
    get traitName() : TraitName,
    getFrom(action : RealtimeAction) : string | undefined
}


const clickacle_CSS_Selector = 
`
button, 
select, 
a[href], 
area[href], 
input[type="button"], 
input[type="submit"], 
input[type="reset"], 
input[type="image"],
[role="button"], 
[role="link"], 
[role="menuitem"], 
[role="option"], 
[role="tab"],
[tabindex]:not([tabindex='-1'])
`

export function getStrictTraitsFrom(action : RealtimeAction) : TraitSet {
    let tagName : string | undefined
    let text : string | undefined
    if (action.event.target instanceof Element) {
        let button = action.event.target.closest(clickacle_CSS_Selector)
        if (button !== null) {
            tagName = button.tagName
            text = button.textContent
        }
    }
    return {
        actionType : action.actionType,
        pageLocation : action.window.location.hostname + action.window.location.pathname,
        controlElementTagName : tagName,
        controlElementText : text
    }
}

export function toActionInfo(action : RealtimeAction) : ActionInfo {
    return {
        page : action.window.location.hostname + action.window.location.pathname,
        time : new Date(action.event.timeStamp),
        strictTraits : getStrictTraitsFrom(action)
    }
}

function isEssentialActionTraits(traits : TraitSet) : boolean {
    return traits.actionType !== undefined 
        && traits.controlElementTagName !== undefined
}

export function isEsentialAction(action : ActionInfo) : boolean {
    return isEssentialActionTraits(action.strictTraits)
}