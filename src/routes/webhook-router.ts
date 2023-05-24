import { Router, Request, Response } from "express"

export const webhookRouter = Router({})

webhookRouter.post('/', (req: Request, res: Response) => {
    console.log(req.body)
    res.status(200)
})

