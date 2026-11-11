import { Measurement, WellnessSurvey, User, ClinicalHistory } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

export const getProgress = async (req, res, next) => {
    try {
        let patientId

        if (req.user.role === 'patient') {
            patientId = req.user.id
        } else {
            if (!req.query.patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }

            const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

            if (!patient) {
                throw new HttpError(404, 'Paciente no encontrado')
            }

            patientId = patient._id
        }

        const days = Number(req.query.days) || 90
        const since = new Date()
        since.setDate(since.getDate() - days)

        const measurements = await Measurement.find({ patient: patientId, date: { $gte: since } })
            .sort({ date: 1 })
            .select('date weightKg waistCm hipCm bodyFatPct')

        const surveys = await WellnessSurvey.find({ patient: patientId, date: { $gte: since } })
            .sort({ date: 1 })
            .select('date mood sleepHours waterGlasses activityMinutes planAdherence')

        let weightChangeKg = null
        if (measurements.length >= 2) {
            const firstWeight = measurements[0].weightKg
            const lastWeight = measurements[measurements.length - 1].weightKg
            weightChangeKg = Number((lastWeight - firstWeight).toFixed(1))
        }

        const firstMeasurement = await Measurement.findOne({ patient: patientId }).sort({ date: 1 }).select('weightKg bodyFatPct')
        const lastMeasurement = await Measurement.findOne({ patient: patientId }).sort({ date: -1 }).select('weightKg bodyFatPct')
        const clinicalHistory = await ClinicalHistory.findOne({ patient: patientId }).select('weightGoalKg bodyFatGoalPct')

        const initialWeightKg = firstMeasurement ? firstMeasurement.weightKg : null
        const currentWeightKg = lastMeasurement ? lastMeasurement.weightKg : null
        const weightGoalKg = clinicalHistory?.weightGoalKg ?? null

        // Qué parte del camino hacia la meta lleva el paciente (sirve para bajar o subir de peso)
        let goalProgressPct = null
        if (initialWeightKg !== null && weightGoalKg !== null && initialWeightKg !== weightGoalKg) {
            const progress = ((initialWeightKg - currentWeightKg) / (initialWeightKg - weightGoalKg)) * 100
            goalProgressPct = Math.round(Math.min(Math.max(progress, 0), 100))
        }

        res.json({
            days,
            measurements,
            surveys,
            summary: {
                totalMeasurements: measurements.length,
                totalSurveys: surveys.length,
                weightChangeKg,
            },
            goals: {
                initialWeightKg,
                currentWeightKg,
                weightGoalKg,
                goalProgressPct,
                currentBodyFatPct: lastMeasurement?.bodyFatPct ?? null,
                bodyFatGoalPct: clinicalHistory?.bodyFatGoalPct ?? null,
            },
        })
    } catch (error) {
        next(error)
    }
}
