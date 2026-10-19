import { Router } from 'express'
import {
    getWellnessSurveys,
    createWellnessSurvey
} from '../controllers/wellness-survey.controller.js'

const router = Router()

router.get('/', getWellnessSurveys)

router.post('/', createWellnessSurvey)

export default router