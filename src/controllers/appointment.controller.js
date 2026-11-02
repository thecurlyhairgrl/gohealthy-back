import { Appointment, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import {
    sendAppointmentScheduledEmail,
    sendAppointmentRescheduledEmail,
    sendAppointmentCancelledEmail,
} from '../emails/appointment-emails.js'

const NAME_FIELDS = 'firstName paternalLastName maternalLastName'

export const getAppointments = async (req, res, next) => {
    try {
        const { patientId, from, to } = req.query
        const filter = {}

        if (req.user.role === 'patient') {
            filter.patient = req.user.id
        } else {
            filter.nutritionist = req.user.id
            if (patientId) {
                filter.patient = patientId
            }
        }

        if (from || to) {
            filter.dateTime = {}
            if (from) {
                filter.dateTime.$gte = new Date(from)
            }
            if (to) {
                filter.dateTime.$lte = new Date(to)
            }
        }

        const appointments = await Appointment.find(filter)
            .sort({ dateTime: 1 })
            .populate('patient', NAME_FIELDS)
            .populate('nutritionist', NAME_FIELDS)

        res.json(appointments)
    } catch (error) {
        next(error)
    }
}

export const getAppointmentById = async (req, res, next) => {
    try {
        const filter = { _id: req.params.id }

        if (req.user.role === 'patient') {
            filter.patient = req.user.id
        } else {
            filter.nutritionist = req.user.id
        }

        const appointment = await Appointment.findOne(filter)
            .populate('patient', NAME_FIELDS)
            .populate('nutritionist', NAME_FIELDS)

        if (!appointment) {
            throw new HttpError(404, 'Cita no encontrada')
        }

        res.json(appointment)
    } catch (error) {
        next(error)
    }
}

export const createAppointment = async (req, res, next) => {
    try {
        const { patientId, dateTime, durationMin, reason, notes } = req.body

        if (!patientId) {
            throw new HttpError(400, 'Falta el patientId')
        }

        const patient = await User.findOne({ _id: patientId, role: 'patient', nutritionist: req.user.id })

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        const appointment = await Appointment.create({
            patient: patient._id,
            nutritionist: req.user.id,
            dateTime,
            durationMin,
            reason,
            notes,
        })

        try {
            await sendAppointmentScheduledEmail(patient, appointment)
        } catch (error) {
            console.error('No se pudo enviar el correo de la cita:', error.message)
        }

        res.status(201).json(appointment)
    } catch (error) {
        next(error)
    }
}

export const updateAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findOne({ _id: req.params.id, nutritionist: req.user.id })

        if (!appointment) {
            throw new HttpError(404, 'Cita no encontrada')
        }

        const { dateTime, durationMin, reason, notes, status } = req.body
        const previousDateTime = appointment.dateTime.getTime()

        if (dateTime !== undefined) {
            appointment.dateTime = dateTime
        }
        if (durationMin !== undefined) {
            appointment.durationMin = durationMin
        }
        if (reason !== undefined) {
            appointment.reason = reason
        }
        if (notes !== undefined) {
            appointment.notes = notes
        }
        if (status !== undefined) {
            appointment.status = status
        }

        const wasRescheduled = appointment.dateTime.getTime() !== previousDateTime
        if (wasRescheduled && status === undefined) {
            appointment.status = 'rescheduled'
        }

        await appointment.save()

        const patient = await User.findById(appointment.patient)
        try {
            if (wasRescheduled) {
                await sendAppointmentRescheduledEmail(patient, appointment)
            } else if (status === 'cancelled') {
                await sendAppointmentCancelledEmail(patient, appointment)
            }
        } catch (error) {
            console.error('No se pudo enviar el correo de la cita:', error.message)
        }

        res.json(appointment)
    } catch (error) {
        next(error)
    }
}
