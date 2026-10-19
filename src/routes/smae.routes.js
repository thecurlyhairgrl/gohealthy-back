import { Router } from 'express'
import { authenticate } from '../middlewares/auth.js'
import { getGroups, getFoods } from '../controllers/smae.controller.js'

const router = Router()

router.use(authenticate)

router.get('/groups', getGroups)
router.get('/foods', getFoods)

export default router
