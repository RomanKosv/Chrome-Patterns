import type { UserAuthData } from "@chrome-patterns/shared/user";
import type { User } from "./db-types.js";
import { getUserByUsername, tryCreateUser } from "./db-funcs.js";
import { Pool as DBPool } from "pg";

export async function getOrCreateUser(auth : UserAuthData, pool : DBPool) : Promise<User> {
    const user = (
        await getUserByUsername(auth.username, pool)
    ) ?? await tryCreateUser(auth.username, pool);
    if (user === undefined) {
        console.error("cannot create or find user with username ", auth.username)
        throw new Error(`cannot create or find user with username ${auth.username}`);
    }
    else {
        return user;
    }
}