import { Router } from 'express'
import measurementRoutes from './measurement.routes.js'
import wellnessSurveyRoutes from './wellness-survey.routes.js'
import labDocumentRoutes from './lab-document.routes.js'
import appointmentRoutes from './appointment.routes.js'
import messageRoutes from './message.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Go Healthy API' })
})

router.use('/measurements', measurementRoutes)
router.use('/wellness-surveys', wellnessSurveyRoutes)
router.use('/lab-documents', labDocumentRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/messages', messageRoutes)
router.use('/dashboard', dashboardRoutes)

export default router
