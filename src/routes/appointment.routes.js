import { Router } from 'express'
import {
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
} from '../controllers/appointment.controller.js'

const router = Router()

router.get('/', getAppointments)
router.get('/:id', getAppointmentById)
router.post('/', createAppointment)
router.put('/:id', updateAppointment)
export default router