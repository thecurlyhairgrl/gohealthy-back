import { Router } from 'express'
import {
    getMeasurements,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
} from '../controllers/measurement.controller.js'

const router = Router()

router.get('/', getMeasurements)
router.post('/', createMeasurement)
router.put('/:id', updateMeasurement)
router.delete('/:id', deleteMeasurement)
export default router