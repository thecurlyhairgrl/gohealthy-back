import { Measurement, WellnessSurvey, User } from '../models/index.js'
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

        res.json({
            days,
            measurements,
            surveys,
            summary: {
                totalMeasurements: measurements.length,
                totalSurveys: surveys.length,
                weightChangeKg,
            },
        })
    } catch (error) {
        next(error)
    }
}
