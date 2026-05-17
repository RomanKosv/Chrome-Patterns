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

export function getStrictTraitsFrom(action : RealtimeAction) : StandaloneTraitSet | undefined {
    if (action.actionType === 'click') {
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
        return control ? {
            actionType : action.actionType,
            pageLocation : action.window.location.hostname + action.window.location.pathname,
            controlElement : control
        } : undefined
    }
    else if (action.actionType === 'input_text') {
        const target = action.event.target
        if ((target instanceof HTMLInputElement) || (target instanceof HTMLTextAreaElement)) {
            return {
                actionType : 'edit_text',
                pageLocation : action.window.location.hostname + action.window.location.pathname,
                newText : target.value,
                controlElement : {
                    tagName : target.tagName,
                    placeholder : target.placeholder
                }
            }
        }
        else return undefined
    }
    else {
        const no : never = action
    }
}

export function toActionInfo(action : RealtimeAction, timeOrigin : number) : StandaloneActionInfo | undefined {
    const traits = getStrictTraitsFrom(action)
    return traits ? {
        page : action.window.location.hostname + action.window.location.pathname,
        time : new Date(action.event.timeStamp + timeOrigin),
        strictTraits : traits
    } : undefined
}
