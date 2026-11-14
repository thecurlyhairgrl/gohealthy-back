import { Appointment, User } from '../models/index.js'
import { HttpError } from '../utils/http-error.js'
import {
    sendAppointmentScheduledEmail,
    sendAppointmentRequestedEmail,
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

// ¿El horario choca con otra cita del nutriólogo que no esté cancelada?
// `ignoreId` es la cita que se está moviendo, para que no choque consigo misma
const findConflict = async (nutritionistId, dateTime, durationMin, ignoreId = null) => {
    const start = new Date(dateTime)
    const end = new Date(start.getTime() + durationMin * 60000)
    const dayStart = new Date(start.getTime() - 24 * 60 * 60000)

    const nearby = await Appointment.find({
        nutritionist: nutritionistId,
        status: { $ne: 'cancelled' },
        dateTime: { $gte: dayStart, $lt: end },
    })

    return nearby.find((other) => {
        if (ignoreId && other._id.equals(ignoreId)) {
            return false
        }
        const otherStart = other.dateTime
        const otherEnd = new Date(otherStart.getTime() + other.durationMin * 60000)
        return start < otherEnd && otherStart < end
    })
}

// Horarios ocupados de un día, sin datos de los pacientes.
// El paciente ve los de su nutriólogo para elegir uno libre al solicitar una cita
export const getAvailability = async (req, res, next) => {
    try {
        const { date } = req.query

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
            throw new HttpError(400, 'La fecha es obligatoria y debe tener el formato AAAA-MM-DD')
        }

        let nutritionistId = req.user.id
        if (req.user.role === 'patient') {
            const patient = await User.findById(req.user.id)
            nutritionistId = patient.nutritionist
        }

        // El día completo en la hora de México
        const from = new Date(`${date}T00:00:00-06:00`)
        const to = new Date(`${date}T23:59:59-06:00`)

        const appointments = await Appointment.find({
            nutritionist: nutritionistId,
            status: { $ne: 'cancelled' },
            dateTime: { $gte: from, $lte: to },
        })
            .sort({ dateTime: 1 })
            .select('dateTime durationMin -_id')

        res.json(appointments)
    } catch (error) {
        next(error)
    }
}

// El nutriólogo agenda una cita; el paciente solo puede solicitarla (queda 'requested')
export const createAppointment = async (req, res, next) => {
    try {
        const { dateTime, durationMin = 60, modality, reason, notes } = req.body
        const isPatient = req.user.role === 'patient'

        let patient
        if (isPatient) {
            patient = await User.findById(req.user.id)
        } else {
            if (!req.body.patientId) {
                throw new HttpError(400, 'Falta el patientId')
            }
            patient = await User.findOne({ _id: req.body.patientId, role: 'patient', nutritionist: req.user.id })
        }

        if (!patient) {
            throw new HttpError(404, 'Paciente no encontrado')
        }

        if (!dateTime) {
            throw new HttpError(400, 'Falta la fecha y hora de la cita')
        }

        if (new Date(dateTime) < new Date()) {
            throw new HttpError(400, 'La cita debe ser en una fecha futura')
        }

        const nutritionistId = isPatient ? patient.nutritionist : req.user.id

        if (await findConflict(nutritionistId, dateTime, durationMin)) {
            throw new HttpError(409, 'Ese horario ya está ocupado. Elige otro')
        }

        const appointment = await Appointment.create({
            patient: patient._id,
            nutritionist: nutritionistId,
            dateTime,
            durationMin,
            modality,
            reason,
            // Las notas son del nutriólogo
            notes: isPatient ? undefined : notes,
            status: isPatient ? 'requested' : 'scheduled',
        })

        try {
            if (isPatient) {
                const nutritionist = await User.findById(nutritionistId)
                await sendAppointmentRequestedEmail(nutritionist, patient, appointment)
            } else {
                await sendAppointmentScheduledEmail(patient, appointment)
            }
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

        const { dateTime, durationMin, modality, reason, notes, status } = req.body
        const previousDateTime = appointment.dateTime.getTime()
        const previousStatus = appointment.status

        if (dateTime !== undefined) {
            appointment.dateTime = dateTime
        }
        if (durationMin !== undefined) {
            appointment.durationMin = durationMin
        }
        if (modality !== undefined) {
            appointment.modality = modality
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

        if (wasRescheduled && (await findConflict(req.user.id, appointment.dateTime, appointment.durationMin, appointment._id))) {
            throw new HttpError(409, 'Ese horario ya está ocupado. Elige otro')
        }

        // Aceptar una solicitud del paciente
        const wasAccepted = previousStatus === 'requested' && appointment.status === 'scheduled'

        await appointment.save()

        const patient = await User.findById(appointment.patient)
        try {
            if (wasAccepted) {
                await sendAppointmentScheduledEmail(patient, appointment)
            } else if (wasRescheduled) {
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
