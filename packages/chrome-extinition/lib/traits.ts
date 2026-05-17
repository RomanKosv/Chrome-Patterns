import { StrictTraitsSet, tryGetPageOpenTime } from "@chrome-patterns/shared/actions"

export type StandaloneTraitSet = StrictTraitsSet & {
    pageLocation : string
} & (
    (
        {
            actionType : 'click',
            controlElement : {
                tagName : string
                text : string
            }
        } | {
            actionType : 'edit_text',
            newText : string,
            controlElement : {
                tagName : string,
                placeholder : string
            }
        }
    )
)

export function isCorrectTraitSet(obj : any) : obj is StandaloneTraitSet {
    if (!obj || typeof obj !== 'object') return false;
    if (typeof obj.pageLocation !== 'string') return false;
    if (!obj.controlElement || typeof obj.controlElement !== 'object') return false;
    if (typeof obj.controlElement.tagName !== 'string') return false;

    // Проверка логики в зависимости от actionType
    if (obj.actionType === 'click') {
        return typeof obj.controlElement.text === 'string';
    } 
    
    if (obj.actionType === 'edit_text') {
        return typeof obj.newText === 'string' && 
               typeof obj.controlElement.placeholder === 'string';
    }

    return false;
}

export function asContextualTraitSet(traits : StandaloneTraitSet) : ContextualTraitSet {
    return {
        ...traits,
        relativePageOpenTime : tryGetPageOpenTime(traits)
    }
}

export type ContextualTraitSet = StandaloneTraitSet & {
    relativePageOpenTime : number | null
}