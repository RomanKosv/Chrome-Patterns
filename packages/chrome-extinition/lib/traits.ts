import { SerializedAction } from "./serialisation";

export interface TraitSelector<T, Name = string> {
    get name(): Name;
    getFrom(action : SerializedAction) : T;
}

type TraitNames = (
    'controlElementTagName'
    | 'controlElementText'
    | 'actionType'
    | 'pageLocation'
)

export const essentialTraitsSelectors : Array<TraitSelector<string | undefined, TraitNames>> = [
    {
        name : 'controlElementTagName',
        getFrom(action) {
            return action.controlElement?.tagName;
        }
    },
    {
        name : 'controlElementText',
        getFrom(action) {
            return action.controlElement?.text;
        }
    },
    {
        name : 'actionType',
        getFrom(action) {
            return action.actionType
        },
    },
    {
        name: 'pageLocation',
        getFrom(action) {
            return action.pageLocation.hostname.concat(action.pageLocation.pathname)
        },
    }
];

export let IsEssentialActionTraitSelector : TraitSelector<boolean> = {
    name: 'isEssentialAction',
    getFrom(action) : boolean {
        switch (action.actionType) {
            case 'click':
                return action.controlElement !== undefined;
            default:
                const no: never = action.actionType;
                return false;
        }
    }
};

export function getEssentialTraitsList(action : SerializedAction) : (string | undefined)[] {
    return essentialTraitsSelectors.map(selector => selector.getFrom(action))
}

// class TraitSet {
//     traitMap : Map<TraitNames, string|undefined>
//     static *traitNamesOrder() : Generator<TraitNames, undefined, void> {
//         for (let selector of essentialTraitsSelectors) {
//             yield selector.name
//         }
//     }
//     constructor(action : SerializedAction) {
//         this.traitMap = new Map();
//         for (let selector of essentialTraitsSelectors) {
//             this.traitMap.set(selector.name, selector.getFrom(action))
//         }
//     }
//     asTraitsArray() : (string | undefined) [] {
//         return TraitSet.traitNamesOrder().map(name => this.traitMap.get(name)).toArray()
//     }
//     activateOn(document : Document) {
//         if (document.location.host.concat(document.location.pathname) === this.traitMap.get('pageLocation')) {
//             switch (this.traitMap.get('actionType')) {
//                 case 'click':
//                     let tagName = this.traitMap.get('controlElementTagName')
//                     if (tagName !== undefined) {
//                         let text = this.traitMap.get('controlElementText')
//                         let xPath = `//${tagName}${text ? `[.='${text}']` : ''}`
//                         let node = document.evaluate(
//                             xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
//                         ).singleNodeValue
//                         if (node instanceof HTMLElement) {
//                             node.click()
//                         }
//                     }
//             }
//         }
//         else{
//             console.error(
//                 "Wrong document loaction:", document.location.toString(), 
//                 "(must be ", this.traitMap.get('pageLocation'), ")"
//             )
//         }
//     }
// }
