import { Router } from 'express'
import measurementRoutes from './measurement.routes.js'
import wellnessSurveyRoutes from './wellness-survey.routes.js'
import labDocumentRoutes from './lab-document.routes.js'
import appointmentRoutes from './appointment.routes.js'
import messageRoutes from './message.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import authRoutes from './auth.routes.js'
import patientRoutes from './patients.routes.js'
import onboardingRoutes from './onboarding.routes.js'
import consultatonRoutes from './consultation.routes.js'

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
router.use('/auth', authRoutes)
router.use('/patients', patientRoutes)
router.use('/onboarding', onboardingRoutes)
router.use('/consultations', consultatonRoutes)

export default router
