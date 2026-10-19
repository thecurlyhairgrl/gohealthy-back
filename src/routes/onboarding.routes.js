import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { getOnboarding, completeOnboarding } from '../controllers/onboarding.controller.js'

const router = Router()

router.use(authenticate, authorize('patient'))

router.get('/', getOnboarding)
router.put('/', completeOnboarding)

export default router