import { RealtimeAction } from "./realtime_actions";
import { StandaloneTraitSet } from "./traits";
import { StandaloneActionInfo } from "./actions";

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

export function getStrictTraitsFrom(action : RealtimeAction) : StandaloneTraitSet {
    let control
    if (action.event.target instanceof Element) {
        let button = action.event.target.closest(clickacle_CSS_Selector)
        if (button !== null) {
            control = {
                tagName : button.tagName,
                text : button.textContent
            }
        }
    }
    return {
        actionType : action.actionType,
        pageLocation : action.window.location.hostname + action.window.location.pathname,
        controlElement : control
    }
}

export function toActionInfo(action : RealtimeAction, timeOrigin : number) : StandaloneActionInfo {
    return {
        page : action.window.location.hostname + action.window.location.pathname,
        time : new Date(action.event.timeStamp + timeOrigin),
        strictTraits : getStrictTraitsFrom(action)
    }
}

function isEssentialActionTraits(traits : StandaloneTraitSet) : boolean {
    return traits.actionType !== undefined 
        && traits.controlElement !== undefined
}

export function isEsentialAction(action : StandaloneActionInfo) : boolean {
    return isEssentialActionTraits(action.strictTraits)
}