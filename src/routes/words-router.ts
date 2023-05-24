import { Router, Request, Response } from "express"
import db from '../config/datebase'
import WordInstance from "../model/index"
import {v4 as uuidv4} from 'uuid'
import WordValidator from "../validator/index"
import Middleware from "../middleware/index"

db.sync().then(() => console.log('db is ready'))

export const wordsRouter = Router({})

wordsRouter.get('/', WordValidator.checkReadWord(), Middleware.checkValidationResult,   
async (req: Request, res: Response) => {
    console.log(req.body)
    try {
        const limit = req.query?.limit as number | undefined;
        const offset = req.query?.limit as number | undefined;

        const data = await WordInstance.findAll({where: {}, limit, offset});
        return res.status(200).json({data})
    } catch (error) {       
        return res.status(500).json({message: 'Error while getting records'})
    }
})

wordsRouter.get('/:id', WordValidator.checkIdParam(), Middleware.checkValidationResult,
async (req: Request, res: Response) => {
    console.log(req.body)
    try {
        const data = await WordInstance.findOne({where: {id: req.params.id}});
        return res.status(200).json({data})
    } catch (error) {
        return res.status(500).json({message: 'Error while getting record'})
    }
})

wordsRouter.post('/', WordValidator.checkCreateWord(), Middleware.checkValidationResult, 
async (req: Request, res: Response) => {
    const id = uuidv4();
try {
    const data = await WordInstance.create({...req.body, id});
    return res.status(201).json({data, message: 'Successfully created'})
} catch (error) {
    return res.status(500).json({message: 'Error while creating record'})
}
})

wordsRouter.put('/:id', WordValidator.checkIdParam(), Middleware.checkValidationResult,
 async (req: Request, res: Response) => {
    console.log(req.body)
    try {
        const data = await WordInstance.findOne({where: {id: req.params.id}});
        
        if (!data) {
            return res.status(404).json({message: 'Record not found'})
        }

        const updatedRecord = await data.update({
            ...req.body
        });
        return res.status(200).json({data: updatedRecord})
    } catch (error) {
        return res.status(500).json({message: 'Error while updating record'})
    }
})

wordsRouter.delete('/:id', WordValidator.checkIdParam(), Middleware.checkValidationResult,
 async (req: Request, res: Response) => {
    console.log(req.body)
    try {
        const data = await WordInstance.findOne({where: {id: req.params.id}});
        
        if (!data) {
            return res.status(404).json({message: 'Record not found'})
        }

        await data.destroy();
        return res.status(204)
    } catch (error) {
        return res.status(500).json({message: 'Error while updating record'})
    }
})