import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import { getProgress } from '../controllers/dashboard.controller.js'

const router = Router()

router.use(authenticate)

router.get('/progress', getProgress)

export default router
