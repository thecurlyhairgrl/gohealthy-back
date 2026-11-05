import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getActivePlan,
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    getPlanHistory,
    getPlanVersion,
} from '../controllers/meal-plan.controller.js'

const router = Router()

router.use(authenticate)

router.get('/active', getActivePlan)

router.get('/', authorize('nutritionist'), getPlans)
router.post('/', authorize('nutritionist'), createPlan)
router.get('/:id', authorize('nutritionist'), getPlanById)
router.put('/:id', authorize('nutritionist'), updatePlan)
router.get('/:id/history', authorize('nutritionist'), getPlanHistory)
router.get('/:id/history/:version', authorize('nutritionist'), getPlanVersion)

export default router