import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getWellnessSurveys,
    createWellnessSurvey,
} from '../controllers/wellness-survey.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getWellnessSurveys)
router.post('/', authorize('patient'), createWellnessSurvey)

export default router
