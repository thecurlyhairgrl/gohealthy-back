import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
    getMeasurements,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
} from '../controllers/measurement.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getMeasurements)
router.post('/', authorize('patient'), createMeasurement)
router.put('/:id', authorize('patient'), updateMeasurement)
router.delete('/:id', authorize('patient'), deleteMeasurement)

export default router
