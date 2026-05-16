import type { UserAuthData } from "@chrome-patterns/shared/user";
import type { User } from "./db-types.js";
import { getUserByGoogleID, tryCreateUserWithGoogleID } from "./db-funcs.js";
import { Pool as DBPool } from "pg";
import { getGoogleID } from "./google-auth.js";

export async function getOrCreateUser(auth : UserAuthData, pool : DBPool) : Promise<User | undefined> {
    const googleID = await getGoogleID(auth.googleOauthToken)
    if (googleID === undefined)
        return undefined
    const user = (
        await getUserByGoogleID(googleID, pool)
    ) ?? await tryCreateUserWithGoogleID(googleID, pool);
    if (user === undefined) {
        console.error("cannot create or find user with google id ", googleID)
        throw new Error(`cannot create or find user with google id ${googleID}`);
    }
    else {
        return user;
    }
}