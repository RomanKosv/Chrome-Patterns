import { catPageOpenTime, type ActionInfo } from "@chrome-patterns/shared/actions"
import { createChildNode, getChildNode, insertAction, visitNode } from "./db-funcs.js";
import { Pool as DBPool } from 'pg';
import type { UserSettings } from "@chrome-patterns/shared/user";

export async function readActionStream(actions : Iterable<ActionInfo>, actionsPrefix : Iterable<ActionInfo>, userID : number, settings : UserSettings, pool : DBPool) {
    let cursors : (number | null | undefined)[] = [null]
    for(let actionInfo of actionsPrefix) {
        for(let curs_i = 0; curs_i < cursors.length; curs_i++) {
            let c = cursors[curs_i]
            if (c !== undefined) {
                let contexualTraits = catPageOpenTime(actionInfo.strictTraits, cursors.length - 1 - curs_i - 1)
                let c1 = (await getChildNode(userID, c, contexualTraits, pool))?.id
                cursors[curs_i] = c1
            }
        }
        if (cursors.length >= settings.maxPatternLenght) {
            cursors.shift()
        }
        cursors.push(null)
    }
    for(let actionInfo of actions) {
        const action = await insertAction(userID, actionInfo, pool)
        for(let curs_i = 0; curs_i < cursors.length; curs_i++) {
            let c = cursors[curs_i]
            if (c !== undefined) {
                let contexualTraits = catPageOpenTime(actionInfo.strictTraits, cursors.length - 1 - curs_i - 1)
                let c1 = (await getChildNode(userID, c, contexualTraits, pool))?.id
                if (c1 === undefined) {
                    c1 = (await createChildNode(userID, c, contexualTraits, pool))
                }
                await visitNode(userID, c1, action, pool)
                cursors[curs_i] = c1
            }
        }
        if (cursors.length >= settings.maxPatternLenght) {
            cursors.shift()
        }
        cursors.push(null)
    }
}