import { StrictTraitsSet } from "@chrome-patterns/shared/actions"

export type TraitSet = StrictTraitsSet & (
    (
        {
            actionType : 'click',
            pageLocation : string,
            controlElement? : {
                tagName : string
                text : string
            }
        }
    )
)

export function isCorrectTraitSet(traits : StrictTraitsSet) : traits is TraitSet {
    if (
        (typeof traits == 'object')
        && (traits !== null)
        && ('actionType' in traits)
        && (traits.actionType === 'click')
        && ('pageLocation' in traits)
        && ((typeof traits.pageLocation) == 'string')
        && (
            (!('controlElement' in traits))
            || 
            (traits.controlElement === undefined)
            ||
            (
                (typeof traits.controlElement == 'object')
                && (traits.controlElement !== null)
                && ('text' in traits.controlElement)
                && (typeof traits.controlElement.text == 'string')
                && ('tagName' in traits.controlElement)
                && (typeof traits.controlElement.tagName === 'string')
            )
        )
    ) {
        traits
        return true
    }
    else return false
}

