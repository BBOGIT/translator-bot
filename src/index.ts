
import express, {Request, Response} from 'express'

import { webhookRouter } from './routes/webhook-router'
import { wordsRouter } from './routes/words-router'

const app = express()
const port = 1889

app.use(express.json())

app.get('/healthcheck', (req: Request, res: Response) => {
    res.send('Я живий!')
})

app.use('/webhook', webhookRouter)

app.use('/words', wordsRouter)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})