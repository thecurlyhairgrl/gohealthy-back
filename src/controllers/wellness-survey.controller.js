import { WellnessSurvey, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/

export const getWellnessSurveys = async (req, res, next) => {
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

        const surveys = await WellnessSurvey.find({ patient: patientId }).sort({ date: -1 })
        res.json(surveys)
    } catch (error) {
        next(error)
    }
}

export const createWellnessSurvey = async (req, res, next) => {
    try {
        const { date, mood, sleepHours, waterGlasses, activityMinutes, planAdherence, comment } = req.body

        if (!DATE_FORMAT.test(date ?? '')) {
            throw new HttpError(400, 'La fecha es obligatoria y debe tener el formato AAAA-MM-DD')
        }

        const survey = await WellnessSurvey.create({
            patient: req.user.id,
            date: new Date(`${date}T00:00:00.000Z`),
            mood,
            sleepHours,
            waterGlasses,
            activityMinutes,
            planAdherence,
            comment,
        })

        res.status(201).json(survey)
    } catch (error) {
        if (error.code === 11000) {
            return next(new HttpError(409, 'Ya registraste la encuesta de ese día'))
        }
        next(error)
    }
}
