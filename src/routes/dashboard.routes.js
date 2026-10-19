import { Router } from 'express'
import { getProgress } from '../controllers/dashboard.controller.js'

const router = Router()

router.get('/progress', getProgress)

export default router