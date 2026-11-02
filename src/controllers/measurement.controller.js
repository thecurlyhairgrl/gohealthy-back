import { Measurement, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

export const getMeasurements = async (req, res, next) => {
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

        const measurements = await Measurement.find({ patient: patientId }).sort({ date: -1 })
        res.json(measurements)
    } catch (error) {
        next(error)
    }
}

export const createMeasurement = async (req, res, next) => {
    try {
        const { date, weightKg, waistCm, hipCm, armCm, bodyFatPct, notes } = req.body

        const measurement = await Measurement.create({
            patient: req.user.id,
            date,
            weightKg,
            waistCm,
            hipCm,
            armCm,
            bodyFatPct,
            notes,
        })

        res.status(201).json(measurement)
    } catch (error) {
        next(error)
    }
}

export const updateMeasurement = async (req, res, next) => {
    try {
        const measurement = await Measurement.findOne({ _id: req.params.id, patient: req.user.id })

        if (!measurement) {
            throw new HttpError(404, 'Medición no encontrada')
        }

        const { date, weightKg, waistCm, hipCm, armCm, bodyFatPct, notes } = req.body
        measurement.set({ date, weightKg, waistCm, hipCm, armCm, bodyFatPct, notes })
        await measurement.save()

        res.json(measurement)
    } catch (error) {
        next(error)
    }
}

export const deleteMeasurement = async (req, res, next) => {
    try {
        const measurement = await Measurement.findOneAndDelete({ _id: req.params.id, patient: req.user.id })

        if (!measurement) {
            throw new HttpError(404, 'Medición no encontrada')
        }

        res.json({ message: 'Medición eliminada' })
    } catch (error) {
        next(error)
    }
}
