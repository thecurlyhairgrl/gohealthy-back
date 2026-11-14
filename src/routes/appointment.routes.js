import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getAppointments,
    getAvailability,
    getAppointmentById,
    createAppointment,
    updateAppointment,
} from '../controllers/appointment.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getAppointments)
router.get('/availability', getAvailability)
router.get('/:id', getAppointmentById)
// El nutriólogo agenda; el paciente solicita (queda 'requested')
router.post('/', createAppointment)
router.put('/:id', authorize('nutritionist'), updateAppointment)

export default router
