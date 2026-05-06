import { Pool as DBPool } from 'pg';
import type { StrictTraitsSet } from './abstract-actions.js';
import type { Action, PatternTreeNode } from './db-types.js';
import { findPackageJSON } from 'node:module';
import type { ActionInfo } from './client-server-data-stream-contract.js';

export async function getChildNode(userID : number, parentID : number | null, traits : StrictTraitsSet, pool : DBPool) : Promise<PatternTreeNode | undefined> {
    return (
        await pool.query<PatternTreeNode>(
            `
            select * from pattern_tree_nodes 
                where 
                    (user_id = $1) 
                    and (
                        (parent_id = $2) 
                        or (parent_id is null and $2 is null)
                    )
                    and (strict_traits = $3::jsonb)
            `,
            [userID, parentID, traits]
        )
    ).rows[0]
}

export async function visitNode(userID : number, nodeID : number, action : Action, pool : DBPool) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query(
            `
            insert into pattern_tree_nodes_actions
                (user_id, node_id, action_id)
                values ($1, $2, $3)
            `,
            [userID, nodeID, action.id]
        )
        await client.query(
            `
            update pattern_tree_nodes
                set enter_count = enter_count + 1,
                    last_visit_time = $3
                where (user_id = $1) and (id = $2)
            `,
            [userID, nodeID, action.time]
        )
        await client.query('COMMIT')
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        await client.release()
    }
}

export async function createChildNode(userID : number, parentID : number | null, traits : StrictTraitsSet, pool : DBPool) : Promise<number> {
    return (
        await pool.query<{id : number}>(
            `
            insert into pattern_tree_nodes 
                (user_id, parent_id, strict_traits, enter_count)
                values ($1, $2, $3::jsonb, 0)
                returning id
            `,
            [userID, parentID, traits]
        )
    ).rows[0]!.id
} 

export async function insertAction(userID : number, action: ActionInfo, pool : DBPool) : Promise<Action> {
    return (
        await pool.query<Action>(
            `
            insert into actions
                (user_id, time, page)
                values ($1, $2, $3)
                returning *
            `,
            [userID, action.time, action.page]
        )
    ).rows[0] !!
}