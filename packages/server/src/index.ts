
import type { PullDataAns, PullDataReq, PushDataAns, PushDataReq } from '@chrome-patterns/shared/requests-data';
import express from 'express';
import type  { Request, Response } from 'express';
import { getOrCreateUser } from './auth.js';
import {Pool as DBPool} from 'pg';
import type { PatternTreeNode } from '@chrome-patterns/shared/pattern-tree';
import { changeUserSettings, getPatternTree, getUserSettings } from './db-funcs.js';
import { readActionStream as readActionStream } from './client-server-data-stream-read.js';
import { getGoogleID } from './google-auth.js';

const pool : DBPool = new DBPool(
    {
        user: 'postgres',
        host: 'localhost',
        database: 'Chrome-Patterns',
        password: 'test123',
        port: 5432
    }
)

const app = express();
// Middleware для парсинга JSON в req.body
app.use(express.json()); 

app.post('/pull_data', async (req: Request, res: Response) => {
    // 1. Получение данных (Запрос)
    console.log('pull request, body: ', req.body)
    try{
        let reqest : PullDataReq = req.body
        let user = await getOrCreateUser(reqest.auth, pool);
        let tree = await getPatternTree(user.id, pool)
        const ans : PullDataAns = {
            tree : tree,
            settings : getUserSettings(user)
        }
        res.json(ans)
    }
    catch (e){
        const ans : PullDataAns = "fail"
        console.log('pull error: ', e)
        res.json(ans)
    }
});

app.post('/push_data', async (req: Request, res: Response) => {
    console.log('push request, body: ', req.body)
    try {
        let reqest : PushDataReq = req.body
        let user = await getOrCreateUser(reqest.auth, pool);
        await changeUserSettings(user.id, reqest.settings, pool)
        readActionStream(reqest.actions, reqest.actionsPrefix, user.id, reqest.settings, pool)
        let ans : PushDataAns = "succes"
        res.json(ans)
    }
    catch (e) {
        console.log('push error: ', e)
        let ans : PushDataAns = "fail"
        res.json(ans)
    }
});

app.post('/test_token', async (req: Request, res: Response) => {
    console.log('test_token reqest, body: ', req.body)
    const id = await getGoogleID(req.body.token)
    console.log('google id:', id)
})

app.listen(3006, () => console.log('Server is running on port 3006'));