import { RealtimeAction } from "./realtime_actions";

interface SerializedControlElement {
    get text() : string;
    get tagName() : string;
}

interface SerializedPageLocation {
    get hostname() : string;
    get pathname() : string;
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

export class SerializedAction{
    actionType : 'click';
    eventPagePosition? : [number, number]
    controlElement? : SerializedControlElement
    pageLocation : SerializedPageLocation
    constructor(action : RealtimeAction) {
        this.actionType = action.actionType;
        this.pageLocation = {
            hostname : action.window.location.hostname,
            pathname : action.window.location.pathname,
        }
        switch (action.actionType) {
            case 'click':
                this.eventPagePosition = [action.event.pageX, action.event.pageY];
                if (action.event.target instanceof Element) {
                    let button = action.event.target.closest(clickacle_CSS_Selector)
                    if (button !== null) {
                        this.controlElement = {
                            tagName : button.tagName,
                            text : button.textContent
                        }
                    }
                }
                break;
            default:
                const no: never = action.actionType;
                break;
        }
    }
    tryActivateOn(document : Document) : boolean {
        if (
            document.location.host.concat(document.location.pathname)
             === this.pageLocation.hostname.concat(this.pageLocation.pathname)
        ) {
            switch (this.actionType) {
                case 'click':
                    if (this.controlElement !== undefined) {
                        let xPath = `//${this.controlElement.tagName}[.='${this.controlElement.text}']`
                        let node = document.evaluate(
                            xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                        ).singleNodeValue
                        if (node instanceof HTMLElement) {
                            node.click()
                            return true;
                        }
                        else{
                            console.warn(
                                "Cannot preform action, control not found",
                                "(control: ", xPath, ")"
                            )
                        }
                    }
                    else{
                        console.error("Action has no control element")
                    }
            }
        }
        else {
            console.error(
                "Wrong document loaction:", document.location.toString(),
                "(must be ", this.pageLocation.hostname.concat(this.pageLocation.pathname)
            )
        }
        return false;
    }
}

