import { PrefixTree, PrefixTreeCursor } from "@/lib/prefix_tree";
import { SerializedAction } from "@/lib/serialisation";

let actionsList : Array<SerializedAction> = []

let prefixTree : PrefixTree = new PrefixTree()
let cursors : PrefixTreeCursor[] = [prefixTree.getCursor(true)]
let shift = 0

const PATTERN_MAX_LENGHT = 10;

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
  browser.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
      if (message.type === 'page_action') {
        let action = message.action as SerializedAction
        console.log(action)
        actionsList.push(action)
        for (let cursor of cursors) {
          cursor.addAction(actionsList.at(-1)!)
        }
        if (cursors.length < PATTERN_MAX_LENGHT + 1) {
          cursors.push(prefixTree.getCursor(true))
        }
        else {
          cursors[shift] = prefixTree.getCursor(true);
          shift = (shift + 1) % (PATTERN_MAX_LENGHT + 1);
        }
        prefixTree.debug()
      }
      sendResponse('backgrownd got message');
    }
  )
});
