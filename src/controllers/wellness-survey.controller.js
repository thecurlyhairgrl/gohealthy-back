import { WellnessSurvey } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/

export const getWellnessSurveys = async (req, res, next) => {
    try {
        const { patientId } = req.query
        if (!patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }
        const surveys = await WellnessSurvey.find({ patient: patientId }).sort({
            date: -1
        })
        res.json(surveys)
    } catch (error) {
        next(error)
    }
}

export const createWellnessSurvey = async (req, res, next) => {
    try {
        const { patientId, date, mood, sleepHours, waterGlasses, activityMinutes,
            planAdherence, comment } = req.body
        if (!DATE_FORMAT.test(date ?? '')) {
            throw new HttpError(400, 'La fecha es obligatoria y debe tener el formato AAAA - MM - DD')
        }
        const survey = await WellnessSurvey.create({
            patient: patientId,
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
