import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
} from '../controllers/appointment.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getAppointments)
router.get('/:id', getAppointmentById)
router.post('/', authorize('nutritionist'), createAppointment)
router.put('/:id', authorize('nutritionist'), updateAppointment)

export default router
