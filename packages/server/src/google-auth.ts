import axios from 'axios';

// 1. Описываем форму ответа, который мы ждем от Google
interface GoogleTokenInfoResponse {
  aud: string;
  sub: string;
  email?: string;
  email_verified?: string;
}

const GOOGLE_CLIENT_ID = "767335034186-qpqv01e69d5jguhvbhcic4j2f3c4bho5.apps.googleusercontent.com"


export async function getGoogleID(token : string) : Promise<string | undefined> {
    try {
        const tokenInfo : GoogleTokenInfoResponse = (await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo',
            {
                params : {
                    access_token : token
                }
            }
        )).data
        return tokenInfo.aud == GOOGLE_CLIENT_ID ? tokenInfo.sub : undefined
    }
    catch (e) {
        console.error(e)
        return undefined
    }
}