import axios from "axios"
import { Router, Request, Response } from "express"
require('dotenv').config()

export const webhookRouter = Router({})

const {TOKEN} = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`


webhookRouter.post('/', async (req: Request, res: Response) => {
    console.log(req.body)
    res.status(200)

    const chatId = req.body.message.from.chatId
    const text = req.body.message.text

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: `You said: ${text}`
    })
})

