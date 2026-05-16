import { Pool as DBPool } from 'pg';
import type { StrictTraitsSet, ActionInfo } from '@chrome-patterns/shared/actions';
import type { Action, PatternTreeNode, User } from './db-types.js';
import { defaultSettings } from './default-settings.js';
import type { PatternConsquense, PatternTreeNode as PatternTreeData} from '@chrome-patterns/shared/pattern-tree';
import type { UserSettings } from '@chrome-patterns/shared/user';

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

export async function getUserByGoogleID(googleID : string, pool : DBPool) : Promise<User | undefined> {
    return (
        await pool.query<User>(
            `
            select * from users
                where google_id = $1
            `,
            [googleID]
        )
    ).rows[0]
}

export async function tryCreateUserWithGoogleID(googleID: string, pool : DBPool) : Promise<User | undefined> {
    return (
        await pool.query<User>(
            `
            insert into users
                (google_id, max_pattern_lenght, automations_count)
                values ($1, $2, $3)
                on conflict (google_id) do nothing
                returning *
            `,
            [googleID, defaultSettings.maxPatternLenght, defaultSettings.automationsCount]
        )
    ).rows[0]
}

export async function getPatternTree(userID : number, pool : DBPool, currentNodeID : number |null = null, probabilityCoef : number = 1) : Promise<PatternTreeData> {
    const childs = (
        await pool.query<PatternTreeNode & {essential_enter_count : number}>(
            `
            select *,
                (
                    select count(action_id) from pattern_tree_nodes_actions
                        where user_id = $1 and node_id = id
                ) as essential_enter_count
                from pattern_tree_nodes
                where user_id = $1 and (parent_id is not distinct from $2)
            `,
            [userID, currentNodeID]
        )
    ).rows
    const childData : PatternConsquense[] = []
    for (const cons of childs) {
        if (cons.essential_enter_count !== 0)
            childData.push(
                {
                    node : await getPatternTree(
                        userID, 
                        pool, 
                        cons.id, 
                        probabilityCoef * (cons.essential_enter_count / cons.enter_count)
                    ),
                    traits : cons.strict_traits,
                    probabilityMetric : cons.essential_enter_count * probabilityCoef
                }
            )
    }
    return {
        consequences : childData
    }
}

export async function changeUserSettings(userID : number, settings : UserSettings, pool : DBPool) {
    await pool.query(
        `
        update users
            set max_pattern_lenght = $2,
                automations_count = $3
            where id = $1
        `,
        [userID, settings.maxPatternLenght, settings.automationsCount]
    )
}

export function getUserSettings(user : User) : UserSettings {
    return {
        maxPatternLenght : user.max_pattern_lenght,
        automationsCount : user.automations_count
    }
}