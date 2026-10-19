import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
} from '../controllers/consultation.controller.js'

const router = Router()

router.use(authenticate, authorize('nutritionist'))

router.get('/', getConsultations)
router.get('/:id', getConsultationById)
router.post('/', createConsultation)
router.put('/:id', updateConsultation)

export default router