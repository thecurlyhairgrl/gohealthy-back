import { Consultation, Appointment, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'

const EDITABLE_FIELDS = ['date', 'measurements', 'energyCalculation', 'diagnosis', 'prognosis', 'instructions', 'notes']

const addBmi = (measurements) => {
    if (measurements && measurements.weightKg && measurements.heightCm) {
        const heightM = measurements.heightCm / 100
        measurements.bmi = Number((measurements.weightKg / (heightM * heightM)).toFixed(1))
    }
    return measurements
}

export const getConsultations = async (req, res, next) => {
    try {
        if (!req.query.patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }

        const patient = await User.findOne({ _id: req.query.patientId, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const consultations = await Consultation.find({ patient: patient._id }).sort({ date: -1 })
        res.json(consultations)
    } catch (error) {
        next(error)
    }
}

export const getConsultationById = async (req, res, next) => {
    try {
        const consultation = await Consultation.findOne({ _id: req.params.id, nutritionist: req.user.id })

        if (!consultation) {
            throw new HttpError(404, 'Consulta no encontrada')
        }

        res.json(consultation)
    } catch (error) {
        next(error)
    }
}

export const createConsultation = async (req, res, next) => {
    try {
        const { patientId, appointmentId, date, measurements, energyCalculation, diagnosis, prognosis, instructions, notes } =
            req.body

        if (!patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }

        const patient = await User.findOne({ _id: patientId, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        let appointment = null
        if (appointmentId) {
            appointment = await Appointment.findOne({ _id: appointmentId, patient: patient._id, nutritionist: req.user.id })

            if (!appointment) {
                throw new HttpError(404, 'Cita no encontrada')
            }
        }

        const consultation = await Consultation.create({
            patient: patient._id,
            nutritionist: req.user.id,
            appointment: appointment ? appointment._id : undefined,
            date,
            measurements: addBmi(measurements),
            energyCalculation,
            diagnosis,
            prognosis,
            instructions,
            notes,
        })

        if (appointment) {
            appointment.consultation = consultation._id
            appointment.status = 'completed'
            await appointment.save()
        }

        res.status(201).json(consultation)
    } catch (error) {
        next(error)
    }
}

export const updateConsultation = async (req, res, next) => {
    try {
        const consultation = await Consultation.findOne({ _id: req.params.id, nutritionist: req.user.id })

        if (!consultation) {
            throw new HttpError(404, 'Consulta no encontrada')
        }

        for (const field of EDITABLE_FIELDS) {
            if (req.body[field] !== undefined) {
                consultation[field] = req.body[field]
            }
        }

        if (req.body.measurements !== undefined) {
            consultation.measurements = addBmi(req.body.measurements)
        }

        await consultation.save()
        res.json(consultation)
    } catch (error) {
        next(error)
    }
}