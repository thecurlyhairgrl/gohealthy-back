import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getPatients,
  createPatient,
  getPatientById,
  updatePatient,
  resendAccess,
  getClinicalHistory,
  updateClinicalHistory,
  getPatientAdherence,
} from '../controllers/patient.controller.js'

const router = Router()

router.use(authenticate, authorize('nutritionist'))

router.get('/', getPatients)
router.post('/', createPatient)
router.get('/:id', getPatientById)
router.put('/:id', updatePatient)
router.post('/:id/resend-access', resendAccess)
router.get('/:id/clinical-history', getClinicalHistory)
router.put('/:id/clinical-history', updateClinicalHistory)
router.get('/:id/adherence', getPatientAdherence)

export default router