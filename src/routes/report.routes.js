import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getPatientFollowUp,
    getWeightProgress,
    getWellnessByCondition,
    getTopFoods,
} from '../controllers/report.controller.js'

const router = Router()

router.use(authenticate, authorize('nutritionist'))

router.get('/patient-follow-up', getPatientFollowUp)
router.get('/weight-progress', getWeightProgress)
router.get('/wellness-by-condition', getWellnessByCondition)
router.get('/top-foods', getTopFoods)

export default router
