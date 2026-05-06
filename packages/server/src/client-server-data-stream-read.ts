import type { ActionInfo } from "./client-server-data-stream-contract.js"
import { createChildNode, getChildNode, insertAction, visitNode } from "./db-funcs.js";
import type { PatternTreeNode, User } from "./db-types.js";
import { Pool as DBPool } from 'pg';

async function readStream(actions : Iterable<ActionInfo>, user : User, pool : DBPool) {
    let cursors : (number | null)[] = [null]
    for(let actionInfo of actions) {
        const action = await insertAction(user.id, actionInfo, pool)
        for(let curs_i = 0; curs_i++; curs_i < cursors.length) {
            let c = cursors[curs_i] as number | null
            let c1 = (await getChildNode(user.id, c, actionInfo.strictTraits, pool))?.id
            if (c1 == undefined) {
                c1 = (await createChildNode(user.id, c, actionInfo.strictTraits, pool))
            }
            await visitNode(user.id, c1, action, pool)
            cursors[curs_i] = c1
        }
        if (cursors.length >= user.max_pattern_lenght) {
            cursors.shift()
        }
        cursors.push(null)
    }
}